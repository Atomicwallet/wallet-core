// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import VETCoin from 'src/coins/collection/VETCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'VET';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(VETCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

jest.spyOn(wallet, 'getLatestBlock').mockReturnValue(
  Promise.resolve({
    id: '0x013a4c18f853eb057196d8ca65d0ba4d825fce0b5b653b5082a9f1b4497fcfd8',
  }),
);

generateWalletTests(wallet);
