// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import NEARCoin from 'src/coins/collection/NEARCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

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
