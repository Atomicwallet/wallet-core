import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import FILCoin from '../../coins/collection/FILCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'FIL';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(FILCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error not implemented in abstract
jest.spyOn(wallet, 'getNonce').mockReturnValue('1');
// @ts-expect-error unimplemented in abstract class
const originalSign = wallet.signTransaction.bind(wallet);
// @ts-expect-error mixin overload
jest.spyOn(wallet, 'signTransaction').mockImplementation((tx) => {
    tx.maxPriorityFeePerGas = '2500000000';
    tx.maxFeePerGas = '30000000000';
    return originalSign(tx);
});
generateWalletTests(wallet);
//# sourceMappingURL=FILCoin.test.js.map