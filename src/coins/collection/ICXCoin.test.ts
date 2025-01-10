import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import ICXCoin from 'src/coins/collection/ICXCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

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
