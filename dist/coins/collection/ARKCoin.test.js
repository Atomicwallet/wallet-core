import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import ARKCoin from '../../coins/collection/ARKCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'ARK';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(ARKCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error unimplemented in abstract class
const originalSign = wallet.signTransaction.bind(wallet);
// @ts-expect-error mixin overload
jest.spyOn(wallet, 'signTransaction').mockImplementation((tx) => {
    tx.data.timeStamp = 246421369;
    return originalSign(tx);
});
generateWalletTests(wallet);
//# sourceMappingURL=ARKCoin.test.js.map