import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import SUICoin from '../../coins/collection/SUICoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'SUI';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(SUICoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'createTransaction').mockImplementation((args) => Promise.resolve(args));
generateWalletTests(wallet);
//# sourceMappingURL=SUICoin.test.js.map