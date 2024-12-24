import keccak256 from 'keccak256';
import { eddsa as EdDSA, utils } from 'elliptic';
import BN from 'bn.js';
import cnBase58 from './cnBase58';

const L =
  7237005577332262213973186563042994240857116359379907606001950938285454250989n;
const MONERO_NETWORK = '12';
const STANDARD_ADDRESS_REG_TEST = new RegExp(
  '^[4][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{94}$',
);
const SUBADDRESS_REG_TEST = new RegExp(
  '^[8][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{94}$',
);
const INTEGRATED_ADDRESS_REG_TEST = new RegExp(
  '^[4][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{105}$',
);
const ADDRESS_TYPE_STANDARD = 'standard';
const ADDRESS_TYPE_SUBADDRESS = 'subaddress';
const ADDRESS_TYPE_INTEGRATED = 'integrated';
const ADDRESS_CONFIG = {
  [ADDRESS_TYPE_STANDARD]: { prod: ['18'], testnet: ['53'] },
  [ADDRESS_TYPE_SUBADDRESS]: { prod: ['42'], testnet: ['63'] },
  [ADDRESS_TYPE_INTEGRATED]: { prod: ['19'], testnet: ['54'] },
};

function scReduce32(hex) {
  if (hex.length !== 32) {
    throw new Error(
      `LibMonero: invalid input length: expected input to be length 32, but got ${hex.length}`,
    );
  }

  return Buffer.from(
    (BigInt(`0x${Buffer.from(hex, 'hex').reverse().toString('hex')}`) % L)
      .toString(16)
      .padStart(64, '0'),
    'hex',
  ).reverse();
}

function isHexValid(hex) {
  return new RegExp(`[0-9a-fA-F]{${hex.length}}`).test(hex);
}

function isSeedHexValid(seedHex) {
  return seedHex && seedHex.length % 2 < 1 && isHexValid(seedHex);
}

function getNormalizedSeed(seed) {
  return seed.length === 32 ? seed : keccak256(seed);
}

function getPrivateSpendKey(validSeed) {
  return scReduce32(validSeed);
}

function getPrivateViewKey(privateSpendKey) {
  return scReduce32(keccak256(privateSpendKey));
}

function getPublicKeyHex(privateKeyHex, ed25519) {
  return utils.toHex(
    ed25519.encodePoint(
      ed25519.curve.g.mul(new BN(privateKeyHex, 'hex', 'le')),
    ),
  );
}

function getAddress(netbyte, pubsk, pubvk) {
  const preAddr = netbyte + pubsk + pubvk;
  const hash = keccak256(Buffer.from(preAddr, 'hex'));
  const addrHex = preAddr + hash.toString('hex').slice(0, 8);

  return cnBase58.encode(addrHex);
}

export function getAccount(seedHex) {
  if (!isHexValid(seedHex)) {
    throw new Error('MoneroLib: getKeys Error: seedHex is invalid hex');
  }
  if (!isSeedHexValid(seedHex)) {
    throw new Error('MoneroLib: getKeys Error: seedHex is not valid');
  }

  const seed = getNormalizedSeed(Buffer.from(seedHex, 'hex'));
  const ed25519 = new EdDSA('ed25519');
  const privSpend = getPrivateSpendKey(seed);
  const privView = getPrivateViewKey(privSpend);
  const pubSpend = getPublicKeyHex(privSpend, ed25519);
  const pubView = getPublicKeyHex(privView, ed25519);

  if (pubSpend.length !== 64 || pubView.length !== 64) {
    throw new Error('Invalid length on pubSpend or pubView');
  }

  const address = getAddress(MONERO_NETWORK, pubSpend, pubView);

  return {
    privSpend: privSpend.toString('hex'),
    privView: privView.toString('hex'),
    pubSpend,
    pubView,
    address,
  };
}

function validateNetwork(decoded, addressType) {
  return (
    parseInt(decoded.substr(0, 2), 16).toString() ===
    ADDRESS_CONFIG[addressType]?.prod[0]
  );
}

function keccak256Checksum(payload) {
  return keccak256(payload).toString('hex').substr(0, 8);
}

function detectAddressType(address) {
  if (STANDARD_ADDRESS_REG_TEST.test(address)) {
    return ADDRESS_TYPE_STANDARD;
  }
  if (SUBADDRESS_REG_TEST.test(address)) {
    return ADDRESS_TYPE_SUBADDRESS;
  }
  if (INTEGRATED_ADDRESS_REG_TEST.test(address)) {
    return ADDRESS_TYPE_INTEGRATED;
  }
  return false;
}

export function validateAddress(address) {
  const addressType = detectAddressType(address);

  if (!addressType) {
    return false;
  }

  const decodedAddrStr = cnBase58.decode(address);

  if (!decodedAddrStr || !validateNetwork(decodedAddrStr, addressType)) {
    return false;
  }

  const addrChecksum = decodedAddrStr.slice(-8);
  const hashChecksum = keccak256Checksum(
    Buffer.from(decodedAddrStr.slice(0, -8), 'hex'),
  );

  return addrChecksum === hashChecksum;
}
