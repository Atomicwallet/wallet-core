// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createHash64 } from '@/__tests__/fixtures/common.fixture';
import { createCoin } from '@/coins';
import LUNACoin from '@/coins/collection/LUNACoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'LUNA';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(LUNACoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

jest.spyOn(wallet, 'createAndSignTx').mockImplementation((payload) => {
  const sig = createHash64(JSON.stringify(payload));

  return sig;
});

generateWalletTests(wallet);
