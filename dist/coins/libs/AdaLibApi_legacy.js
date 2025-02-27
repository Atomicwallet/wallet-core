import bs58 from 'bs58check';
import core from 'cardano-crypto-js';
import cbor from 'cbor';
import { pbkdf2Sync } from 'pbkdf2';
import { WalletError } from '../../errors/index.js';
import { WALLET_ERROR } from '../../utils/index.js';
const HARDENED_THRESHOLD = 0x80000000;
const derivationPath = [HARDENED_THRESHOLD, HARDENED_THRESHOLD];
const TX_WITNESS_SIZE_BYTES = 142;
const TWO = 2;
/*
 * "011a2d964a095820" is a magic prefix from the cardano-sl code
 * the "01" byte is a constant to denote signatures of transactions
 * the "5820" part is the CBOR prefix for a hex string
 */
const TX_SIGN_MESSAGE_PREFIX = '011a2d964a095820';
class CborIndefiniteLengthArray {
    constructor(elements) {
        this.elements = elements;
    }
    encodeCBOR(encoder) {
        return encoder.push(Buffer.concat([
            Buffer.from([0x9f]), // indefinite array prefix
            ...this.elements.map((element) => cbor.encode(element)),
            Buffer.from([0xff]), // end of array
        ]));
    }
}
// https://cardanodocs.com/cardano/transaction-fees/
function txFeeFunction(txSizeInBytes, bytesMultiplier, feeConstantPart) {
    return Math.ceil(feeConstantPart + txSizeInBytes * bytesMultiplier);
}
/**
 * @param secret
 * @param secretKey
 * @param publicKey
 * @param chainCode
 * @returns {{secretKey: *, publicKey: *, chainCode: *, extendedPublicKey: (*|WordArray|number[]|string|T[]),
 * toBuffer: (function(): (*|WordArray|T[]|string)), toString: (function(): *)}}
 * @constructor
 */
function HDNode({ secret, secretKey, publicKey, chainCode }) {
    /*
     * HD node groups secretKey, publicKey and chainCode
     * can be initialized from Buffers or single string
     * @param secretKey as Buffer
     * @param publicKey as Buffer
     * @param chainCode as Buffer
     */
    if (secret) {
        secretKey = secret.slice(0, 64);
        publicKey = secret.slice(64, 96);
        chainCode = secret.slice(96, 128);
    }
    else {
        secret = Buffer.concat([secretKey, publicKey, chainCode]);
    }
    const extendedPublicKey = Buffer.concat([publicKey, chainCode], 64);
    function toBuffer() {
        return Buffer.concat([secretKey, extendedPublicKey]);
    }
    function toString() {
        return toBuffer().toString('hex');
    }
    return {
        secretKey,
        publicKey,
        chainCode,
        extendedPublicKey,
        toBuffer,
        toString,
    };
}
/**
 * return private key from mnemonic string
 * @param mnemonicString
 * @returns {*}
 */
async function getPrivateKeyByMnemonic(mnemonicString) {
    const walletSecret = await core.mnemonicToRootKeypair(mnemonicString, 1);
    return bs58.encode(walletSecret);
}
/**
 * @param hdNode
 * @param childIndex
 * @returns {{secretKey: *, publicKey: *, chainCode: *, extendedPublicKey: (*|WordArray|number[]|string|T[]),
 * toBuffer: (function(): (*|WordArray|T[]|string)), toString: (function(): *)}}
 */
function deriveChildHdNode(hdNode, childIndex) {
    const result = core.derivePrivate(hdNode.toBuffer(), childIndex, 1);
    return HDNode({
        secretKey: result.slice(0, 64),
        publicKey: result.slice(64, 96),
        chainCode: result.slice(96, 128),
    });
}
/**
 * @param privateKey
 * @returns {*}
 */
function getAddressByPrivateKeySync(privateKey) {
    const walletSecret = bs58.decode(privateKey);
    const masterHDNode = HDNode({ secret: walletSecret });
    const xpub = derivationPath.reduce(deriveChildHdNode, masterHDNode).extendedPublicKey;
    const hdPassphrase = getHDPassphrase(privateKey);
    return core.packAddress(derivationPath, xpub, hdPassphrase, 1);
}
/**
 * @param address
 * @returns {boolean}
 */
async function validateAddress(address) {
    if (!address) {
        return false;
    }
    try {
        return core.isValidAddress(address);
    }
    catch (error) {
        return false;
    }
}
/**
 * @param address
 * @param privateKey
 */
async function getDerivationPathFromAddress(address, privateKey) {
    const hdPassphrase = await getHDPassphrase(privateKey);
    return core.unpackAddress(address, hdPassphrase).derivationPath;
}
/**
 * @param privateKey
 * @returns {*}
 */
function getHDPassphrase(privateKey) {
    const walletSecret = bs58.decode(privateKey);
    const masterHDNode = HDNode({ secret: walletSecret });
    return pbkdf2Sync(masterHDNode.extendedPublicKey, 'address-hashing', 500, 32, 'sha512');
}
function getHDKey(privateKey) {
    const walletSecret = bs58.decode(privateKey);
    const masterHDNode = HDNode({ secret: walletSecret });
    return pbkdf2Sync(Buffer.concat([masterHDNode.secretKey, masterHDNode.chainCode]), '', 4096, 96, 'sha512');
}
/**
 * @param message
 * @param keyDerivationPath
 * @param masterHDNode
 */
function sign(message, keyDerivationPath, masterHDNode) {
    const hdNode = keyDerivationPath.reduce(deriveChildHdNode, masterHDNode);
    const messageToSign = Buffer.from(message, 'hex');
    return core.sign(messageToSign, hdNode.toBuffer());
}
/**
 * sign transaction
 * @param txAux
 * @param privateKey
 * @returns {{getId, witnesses, txAux, encodeCBOR}}
 */
async function signTxGetStructured(txAux, privateKey) {
    const txHash = txAux.getId();
    const witnesses = await Promise.all(txAux.inputs.map(async (input) => {
        const derivPath = await getDerivationPathFromAddress(input.utxo.receiver, privateKey);
        const walletSecret = bs58.decode(privateKey);
        const masterHDNode = HDNode({ secret: walletSecret });
        const xpub = derivPath.reduce(deriveChildHdNode, masterHDNode).extendedPublicKey;
        const signature = sign(`${TX_SIGN_MESSAGE_PREFIX}${txHash}`, derivPath, masterHDNode);
        return TxWitness(xpub, signature);
    }));
    return SignedTransactionStructured(txAux, witnesses);
}
async function prepareSignedTx(utxos, address, changeAddress, coins, privateKey, fee) {
    const txAux = await prepareTxAux(utxos, address, changeAddress, Number(coins), fee);
    const signedTx = signTx(txAux, privateKey);
    return signedTx;
}
async function signTx(txAux, privateKey) {
    const signedTxStructured = await signTxGetStructured(txAux, privateKey);
    return {
        txHash: signedTxStructured.getId(),
        txBody: cbor.encode(signedTxStructured).toString('hex'),
        cbor: cbor.encode(signedTxStructured),
    };
}
function TxAux(inputs, outputs, attributes) {
    function getId() {
        return core.blake2b(cbor.encode(TxAux(inputs, outputs, attributes)), 32).toString('hex');
    }
    function encodeCBOR(encoder) {
        return encoder.pushAny([new CborIndefiniteLengthArray(inputs), new CborIndefiniteLengthArray(outputs), attributes]);
    }
    return {
        getId,
        inputs,
        outputs,
        attributes,
        encodeCBOR,
    };
}
function TxWitness(extendedPublicKey, signature) {
    // default - PkWitness
    const type = 0;
    function encodeCBOR(encoder) {
        return encoder.pushAny([type, new cbor.Tagged(24, cbor.encode([extendedPublicKey, signature]))]);
    }
    return {
        extendedPublicKey,
        signature,
        encodeCBOR,
    };
}
function TxInputFromUtxo(utxo) {
    // default input type
    const type = 0;
    const coins = utxo.amount;
    const txHash = utxo.tx_hash;
    const outputIndex = utxo.tx_index;
    function encodeCBOR(encoder) {
        const result = encoder.pushAny([type, new cbor.Tagged(24, cbor.encode([Buffer.from(txHash, 'hex'), outputIndex]))]);
        return result;
    }
    return {
        coins,
        txHash,
        outputIndex,
        utxo,
        encodeCBOR,
    };
}
function TxOutput(address, coins, isChange) {
    function encodeCBOR(encoder) {
        return encoder.pushAny([AddressCborWrapper(address), coins]);
    }
    return {
        address,
        coins,
        isChange,
        encodeCBOR,
    };
}
function AddressCborWrapper(address) {
    function encodeCBOR(encoder) {
        return encoder.push(address);
    }
    return {
        address,
        encodeCBOR,
    };
}
function SignedTransactionStructured(txAux, witnesses) {
    function getId() {
        return txAux.getId();
    }
    function encodeCBOR(encoder) {
        return encoder.pushAny([txAux, witnesses]);
    }
    return {
        getId,
        witnesses,
        txAux,
        encodeCBOR,
    };
}
function estimateTxSize(txInputs, outAddress, coins, hasChange) {
    const txInputsSize = cbor.encode(new CborIndefiniteLengthArray(txInputs)).length;
    const outAddressSize = outAddress.length;
    // size of addresses used by AdaLite
    const ownAddressSize = 76;
    /*
     * we assume that at most two outputs (destination and change address) will be present
     * encoded in an indefinite length array
     */
    const maxCborCoinsLen = 9; // length of CBOR encoded 64 bit integer, currently max supported
    const txOutputsSize = hasChange
        ? outAddressSize + ownAddressSize + maxCborCoinsLen * TWO + TWO
        : outAddressSize + maxCborCoinsLen + TWO;
    const txMetaSize = 1; // currently empty Map
    // the 1 is there for the CBOR "tag" for an array of 3 elements
    const txAuxSize = 1 + txInputsSize + txOutputsSize + txMetaSize;
    const txWitnessesSize = txInputs.length * TX_WITNESS_SIZE_BYTES + 1;
    // the 1 is there for the CBOR "tag" for an array of 2 elements
    const txSizeInBytes = 1 + txAuxSize + txWitnessesSize;
    /*
     * the deviation is there for the array of tx witnesses
     * because it may have more than 1 byte of overhead
     * if more than 16 elements are present
     */
    const deviation = 4;
    return txSizeInBytes + deviation;
}
async function prepareTxInputs(utxos) {
    const txInputs = [];
    for (let idx = 0; idx < utxos.length; idx += 1) {
        txInputs.push(TxInputFromUtxo(utxos[idx]));
    }
    return txInputs;
}
async function prepareTxAux(utxos, address, changeAddress, coins, fee) {
    const txInputs = await prepareTxInputs(utxos, address, coins);
    const txInputsCoinsSum = txInputs.reduce((acc, elem) => acc + Number(elem.coins), 0);
    const changeAmount = txInputsCoinsSum - coins - Number(fee);
    if (changeAmount < 0) {
        throw new WalletError({
            type: WALLET_ERROR,
            error: new Error(`Transaction inputs (sum ${txInputsCoinsSum}) don't cover coins (${coins}) + fee (${fee})`),
            instance: this,
        });
    }
    const txOutputs = [TxOutput(address, coins, false)];
    if (changeAmount > 0) {
        txOutputs.push(TxOutput(changeAddress, changeAmount, true));
    }
    return TxAux(txInputs, txOutputs, {});
}
async function getTxFee(utxos, address, coins, feePerByte, constantPart) {
    const txInputs = await prepareTxInputs(utxos, address, coins);
    return Math.ceil(computeTxFee(txInputs, address, coins, feePerByte, constantPart));
}
function computeTxFee(txInputs, address, coins, feePerByte, constantPart) {
    if (coins > Number.MAX_SAFE_INTEGER) {
        throw new WalletError({
            type: WALLET_ERROR,
            error: new Error(`Unsupported amount of coins: ${coins}`),
            instance: this,
        });
    }
    const txInputsCoinsSum = txInputs.reduce((acc, elem) => acc + elem.coins, 0);
    // first we try one output transaction
    const oneOutputFee = txFeeFunction(estimateTxSize(txInputs, address, coins, false), feePerByte, constantPart);
    /*
     * if (coins+oneOutputFee) is equal to (txInputsCoinsSum) it means there is no change necessary
     * if (coins+oneOutputFee) is bigger the transaction is invalid even with higher fee
     * so we let caller handle it
     */
    if (coins + oneOutputFee >= txInputsCoinsSum) {
        return oneOutputFee;
    }
    // we try to compute fee for 2 output tx
    const twoOutputFee = txFeeFunction(estimateTxSize(txInputs, address, coins, true), feePerByte, constantPart);
    if (coins + twoOutputFee > txInputsCoinsSum) {
        // means one output transaction was possible, while 2 output is not
        // so we return fee equal to inputs - coins which is guaranteed to pass
        return txInputsCoinsSum - coins;
    }
    return twoOutputFee;
}
export default {
    getDerivationPathFromAddress,
    getPrivateKeyByMnemonic,
    getAddressByPrivateKey: getAddressByPrivateKeySync,
    getTxFee,
    prepareSignedTx,
    validateAddress,
    getHDKey,
};
//# sourceMappingURL=AdaLibApi_legacy.js.map