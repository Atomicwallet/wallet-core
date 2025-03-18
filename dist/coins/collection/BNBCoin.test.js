import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import BNBCoin from '../../coins/collection/BNBCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'BNB';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(BNBCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error not implemente in abstract class
jest.spyOn(wallet, 'initClientKey').mockImplementation(() => { });
generateWalletTests(wallet);
//# sourceMappingURL=BNBCoin.test.js.map