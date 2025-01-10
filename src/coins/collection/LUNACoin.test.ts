// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createHash64 } from 'src/__tests__/fixtures/common.fixture';
import { createCoin } from 'src/coins';
import LUNACoin from 'src/coins/collection/LUNACoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

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
