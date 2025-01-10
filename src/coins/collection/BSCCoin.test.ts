import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import BSCCoin from 'src/coins/collection/BSCCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

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

jest.spyOn(wallet, 'getGasPrice').mockReturnValue(Promise.resolve('5000000000'));

generateWalletTests(wallet);
