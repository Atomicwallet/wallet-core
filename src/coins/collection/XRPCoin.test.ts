import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import XRPCoin from 'src/coins/collection/XRPCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'XRP';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(XRPCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

// @ts-expect-error typ
jest.spyOn(wallet.explorer!, 'getCurrentLedger').mockReturnValue(1337);

jest.mock('ripple-lib', () => {
  return {
    RippleAPI: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(true),
      isConnected: jest.fn().mockReturnValue(true),
      preparePayment: jest.fn().mockImplementation((address, payment) => {
        return Promise.resolve({
          txJSON: JSON.stringify({
            TransactionType: 'Payment',
            Account: address,
            Amount: payment.destination.amount.value,
            Destination: payment.destination.address,
            Fee: '12',
            Sequence: 1,
          }),
        });
      }),
      sign: jest.fn().mockImplementation((tx: object) => {
        return {
          signedTransaction: tx,
        };
      }),
      getAccountInfo: jest.fn().mockRejectedValue(new Error('Account not found')),
    })),
  };
});

generateWalletTests(wallet);
