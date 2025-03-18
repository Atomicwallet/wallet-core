import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import XRPCoin from '../../coins/collection/XRPCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'XRP';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(XRPCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error typ
jest.spyOn(wallet.explorer, 'getCurrentLedger').mockReturnValue(1337);
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
            sign: jest.fn().mockImplementation((tx) => {
                return {
                    signedTransaction: tx,
                };
            }),
            getAccountInfo: jest.fn().mockRejectedValue(new Error('Account not found')),
        })),
    };
});
generateWalletTests(wallet);
//# sourceMappingURL=XRPCoin.test.js.map