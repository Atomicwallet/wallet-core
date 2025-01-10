import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import WAVESCoin from '@/coins/collection/WAVESCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'WAVES';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(WAVESCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

generateWalletTests(wallet);
