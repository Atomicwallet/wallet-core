import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import EOSCoin from '@/coins/collection/EOSCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'EOS';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(EOSCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

generateWalletTests(wallet);
