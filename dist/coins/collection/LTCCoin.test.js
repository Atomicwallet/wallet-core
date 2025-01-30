import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import LTCCoin from '../../coins/collection/LTCCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'LTC';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(LTCCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
generateWalletTests(wallet);
//# sourceMappingURL=LTCCoin.test.js.map