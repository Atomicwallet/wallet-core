// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import NEARCoin from '@/coins/collection/NEARCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'NEAR';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(NEARCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

jest.spyOn(wallet, 'getAccessKey').mockImplementation((publicKey) => {
  return {
    publicKey,
    accessKey: {
      nonce: 42,
      permission: {
        isFullAccess: () => true,
        isFunctionCall: () => false,
      },
    },
    block_hash: '6yhqS2ZyGSMpSneM1moVjwHNYYthAzYccFsMBEGd28hy',
  };
});

generateWalletTests(wallet);
