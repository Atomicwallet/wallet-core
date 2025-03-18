import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import KMDCoin from '../../coins/collection/KMDCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'KMD';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(KMDCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getFee').mockReturnValue(Promise.resolve(new wallet.BN('45630')));
// @ts-expect-error unimplemented in abstract class
const originalSign = wallet.signTransaction.bind(wallet);
// @ts-expect-error mixin overload
jest.spyOn(wallet, 'signTransaction').mockImplementation((txBuilder, inputs, privateKey) => {
    txBuilder.tx.locktime = 1736526236;
    return originalSign(txBuilder, inputs, privateKey);
});
generateWalletTests(wallet);
//# sourceMappingURL=KMDCoin.test.js.map