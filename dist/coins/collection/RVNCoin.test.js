import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import RVNCoin from '../../coins/collection/RVNCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'RVN';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(RVNCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
generateWalletTests(wallet);
//# sourceMappingURL=RVNCoin.test.js.map