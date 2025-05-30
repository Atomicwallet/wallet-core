// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import FTMCoin from 'src/coins/collection/FTMCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'FTM';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(FTMCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

jest.spyOn(wallet, 'getGasPrice').mockReturnValue('2157509223');

generateWalletTests(wallet);
