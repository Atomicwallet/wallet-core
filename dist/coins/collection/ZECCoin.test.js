import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import ZECCoin from '../../coins/collection/ZECCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'ZEC';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(ZECCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
generateWalletTests(wallet);
//# sourceMappingURL=ZECCoin.test.js.map