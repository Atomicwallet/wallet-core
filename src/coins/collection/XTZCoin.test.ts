import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createHash64 } from 'src/__tests__/fixtures/common.fixture';
import { createCoin } from 'src/coins';
import XTZCoin from 'src/coins/collection/XTZCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

jest.mock('axios');

const generateMockData = (address: string) => {
  return {
    mockBlockHash: createHash64(`${address}block`, 32),
    mockChainId: createHash64(`${address}chain`, 32),
    mockProtocol: createHash64(`${address}protocol`, 32),
    mockRawTx: createHash64(`${address}rawTx`, 32),
    mockSignature: createHash64(`${address}signature`, 32),
  };
};

const id = 'XTZ';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(XTZCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

// @ts-expect-error typ
jest.spyOn(wallet, 'create').mockImplementation((operation) => {
  const mockData = generateMockData(operation.destination);
  return Promise.resolve(mockData.mockRawTx);
});

generateWalletTests(wallet);
