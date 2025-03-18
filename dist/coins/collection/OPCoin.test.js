import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import OPCoin from '../../coins/collection/OPCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'OP';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(OPCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getGasPrice').mockReturnValue(Promise.resolve('1001000538'));
generateWalletTests(wallet);
//# sourceMappingURL=OPCoin.test.js.map