import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import HBARCoin from 'src/coins/collection/HBARCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'HBAR';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(HBARCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

// @todo proper tx mocks should be defined
// @ts-expect-error typ
jest.spyOn(wallet, 'createTransaction').mockImplementation(({ address, amount }) => {
  return { address, amount };
});

generateWalletTests(wallet);
