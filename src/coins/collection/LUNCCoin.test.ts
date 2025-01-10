// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createHash64 } from '@/__tests__/fixtures/common.fixture';
import { createCoin } from '@/coins';
import LUNCCoin from '@/coins/collection/LUNCCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'LUNC';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

let wallet = createCoin(LUNCCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

jest.spyOn(wallet, 'estimateFeeAndTax').mockReturnValue({
  fee: { gas: '1397796', amount: [{ denom: 'uluna', amount: '39592572' }] },
  tax: { denom: 'uluna', amount: '0' },
});

jest.spyOn(wallet, 'createAndSignTx').mockImplementation((payload) => {
  const sig = createHash64(JSON.stringify(payload));

  return sig;
});

generateWalletTests(wallet);
