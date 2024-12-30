import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import ETHCoin from '@/coins/collection/ETHCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'ETH';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(ETHCoin, config as CoinDataConfig);

const test = () => generateWalletTests(wallet);

if (require.main === module) {
  test();
}

export default test;
