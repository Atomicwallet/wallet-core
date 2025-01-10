import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import BSCCoin from '@/coins/collection/BSCCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'BSC';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(BSCCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

wallet.nonce = 1;

jest
  .spyOn(wallet, 'getGasPrice')
  .mockReturnValue(Promise.resolve('5000000000'));

generateWalletTests(wallet);
