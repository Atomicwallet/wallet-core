import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCosmoMockSignedData } from 'src/__tests__/fixtures/common.fixture';
import { createCoin } from 'src/coins';
import KAVACoin from 'src/coins/collection/KAVACoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'KAVA';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(KAVACoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

jest.spyOn(wallet, 'createTransaction').mockImplementation(({ address }) => {
  const { bodyBytes, authInfoBytes, signature } = createCosmoMockSignedData(address);

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
