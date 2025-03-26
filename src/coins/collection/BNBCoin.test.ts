import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import BNBCoin from 'src/coins/collection/BNBCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'BNB';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(BNBCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

// @ts-expect-error not implemente in abstract class
jest.spyOn(wallet, 'initClientKey').mockImplementation(() => {});

generateWalletTests(wallet);
