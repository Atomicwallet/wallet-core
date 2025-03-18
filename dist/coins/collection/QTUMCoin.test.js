import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import QTUMCoin from '../../coins/collection/QTUMCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'QTUM';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(QTUMCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
generateWalletTests(wallet);
//# sourceMappingURL=QTUMCoin.test.js.map