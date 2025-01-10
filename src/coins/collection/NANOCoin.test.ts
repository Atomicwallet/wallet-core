// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { createHash } from 'crypto';

import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import NANOCoin from 'src/coins/collection/NANOCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'NANO';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(NANOCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

export const generateMockData = (address: string) => {
  const hash = createHash('sha256').update(address).digest();
  return {
    work: hash.slice(0, 16).toString('hex'),
    publicKey: hash.slice(16, 48).toString('hex'),
    signature: hash.slice(48, 112).toString('hex'),
  };
};

jest.spyOn(wallet, 'getInfo').mockResolvedValue(undefined);

jest.spyOn(wallet, 'getWork').mockImplementation(async (frontier) => {
  const { work } = generateMockData(wallet.address);
  return work;
});

jest.spyOn(wallet, 'getAccountPublicKey').mockImplementation(async (address) => {
  const { publicKey } = generateMockData(address);
  return publicKey;
});

jest.spyOn(wallet, 'signSendBlock').mockImplementation(async (payload, balance) => {
  const { signature } = generateMockData(wallet.address);
  return signature;
});

generateWalletTests(wallet);
