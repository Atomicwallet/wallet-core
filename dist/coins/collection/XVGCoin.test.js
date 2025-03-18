import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import XVGCoin from '../../coins/collection/XVGCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'XVG';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(XVGCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getFee').mockReturnValue(Promise.resolve(new wallet.BN('50000')));
// @ts-expect-error bitcore mixin overload
jest.spyOn(wallet, 'getTimestamp').mockReturnValue(1736518352);
generateWalletTests(wallet);
//# sourceMappingURL=XVGCoin.test.js.map