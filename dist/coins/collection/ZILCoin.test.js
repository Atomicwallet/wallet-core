import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import ZILCoin from '../../coins/collection/ZILCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'ZIL';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(ZILCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error not implemented in abstract
jest.spyOn(wallet, 'getNonce').mockReturnValue(1);
generateWalletTests(wallet);
//# sourceMappingURL=ZILCoin.test.js.map