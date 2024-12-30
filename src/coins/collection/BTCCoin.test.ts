import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import BTCCoin from '@/coins/collection/BTCCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'BTC';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(BTCCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

const test = () => generateWalletTests(wallet);

if (require.main === module) {
  console.log('Called');
  test();
}

export default test;
