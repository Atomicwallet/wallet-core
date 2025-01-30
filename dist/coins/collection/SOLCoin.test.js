import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import SOLCoin from '../../coins/collection/SOLCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'SOL';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(SOLCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
generateWalletTests(wallet);
//# sourceMappingURL=SOLCoin.test.js.map