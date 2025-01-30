import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import XLMCoin from '../../coins/collection/XLMCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'XLM';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(XLMCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
generateWalletTests(wallet);
//# sourceMappingURL=XLMCoin.test.js.map