import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCosmoMockSignedData } from '@/__tests__/fixtures/common.fixture';
import { createCoin } from '@/coins';
import FETCoin from '@/coins/collection/FETCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'FET';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(FETCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

jest.spyOn(wallet, 'createTransaction').mockImplementation(({ address }) => {
  const { bodyBytes, authInfoBytes, signature } =
    createCosmoMockSignedData(address);

  return Promise.resolve({
    signed: {
      bodyBytes,
      authInfoBytes,
      chainId: 'cosmoshub-4',
      accountNumber: '1337',
    },
    signature: {
      signature,
    },
  });
});

generateWalletTests(wallet);
