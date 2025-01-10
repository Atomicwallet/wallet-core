import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import ICXCoin from '@/coins/collection/ICXCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'ICX';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(ICXCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

// @todo implement proper testint mocks
// @ts-expect-error typ
jest.spyOn(wallet, 'signTransaction').mockImplementation((tx) => {
  delete tx.timestamp;
  return tx;
});

generateWalletTests(wallet);
