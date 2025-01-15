import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import ADACoin from 'src/coins/collection/ADACoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'ADA';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(ADACoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

const generateMockUtxo = (index: number, receiver: string) => {
  return {
    amount: (10000000 * index).toString(),
    receiver,
    tx_hash: `d4b5a0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e${index}`,
    tx_index: index,
    utxo_id: `d4b5a0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e${index}`,
  };
};

jest.mock('cardano-wallet-asm', () => ({}), { virtual: true });
jest.mock('cardano-wallet-browser', () => ({}), { virtual: true });
jest.mock('@emurgo/cardano-serialization-asmjs', () => ({}), { virtual: true });
jest.mock('@emurgo/cardano-serialization-lib-browser', () => ({}), { virtual: true });

// @ts-expect-error arg impl
jest.spyOn(wallet, 'getUnspentOutputs').mockImplementation((address: string) => {
  return Promise.resolve([generateMockUtxo(1, address), generateMockUtxo(2, address), generateMockUtxo(3, address)]);
});

// @ts-expect-error typ
jest.spyOn(wallet, 'getLatestBlock').mockReturnValue({
  hash: '1ea248efdae893dc79f43ef628559f7fa09c62f893029e64981091391efafea4',
  block_no: 11355705,
  slot_no: '145392767',
  time: '2025-01-15T16:37:38.000Z',
  tx_count: '44',
});

const originalCreateTx = wallet.createTransaction.bind(wallet);

jest.spyOn(wallet, 'createTransaction').mockImplementation(async (args) => {
  // @ts-expect-error object type def
  const { rawtx } = await originalCreateTx(args);

  return rawtx;
});

generateWalletTests(wallet);
