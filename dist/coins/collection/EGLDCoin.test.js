import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import EGLDCoin from '../../coins/collection/EGLDCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'EGLD';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(EGLDCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
generateWalletTests(wallet);
//# sourceMappingURL=EGLDCoin.test.js.map