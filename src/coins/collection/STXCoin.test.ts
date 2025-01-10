// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import STXCoin from '@/coins/collection/STXCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'STX';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(STXCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

// stx lib serialized amount as bigint
// so we need to cast it to string before stringify as JSON
BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

jest.spyOn(wallet, 'getNonce').mockReturnValue('1');

generateWalletTests(wallet);
