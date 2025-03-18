import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import XEMCoin from '../../coins/collection/XEMCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'XEM';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(XEMCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error unimplemented in abstract class
const originalSign = wallet.signTransaction.bind(wallet);
// @ts-expect-error mixin overload
jest.spyOn(wallet, 'signTransaction').mockImplementation((tx) => {
    tx.timeStamp = 308934494;
    tx.deadline = tx.timestamp + tx.timestamp;
    return originalSign(tx);
});
generateWalletTests(wallet);
//# sourceMappingURL=XEMCoin.test.js.map