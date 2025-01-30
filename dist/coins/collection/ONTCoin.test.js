import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import ONTCoin from '../../coins/collection/ONTCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'ONT';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(ONTCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error unimplemented in abstract class
const originalSign = wallet.signTransaction.bind(wallet);
// @ts-expect-error mixin overload
jest.spyOn(wallet, 'signTransaction').mockImplementation((tx) => {
    tx.nonce = '00000000';
    return originalSign(tx);
});
generateWalletTests(wallet);
//# sourceMappingURL=ONTCoin.test.js.map