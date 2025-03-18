import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import ICXCoin from '../../coins/collection/ICXCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'ICX';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(ICXCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @todo implement proper testint mocks
// @ts-expect-error typ
jest.spyOn(wallet, 'signTransaction').mockImplementation((tx) => {
    delete tx.timestamp;
    return tx;
});
generateWalletTests(wallet);
//# sourceMappingURL=ICXCoin.test.js.map