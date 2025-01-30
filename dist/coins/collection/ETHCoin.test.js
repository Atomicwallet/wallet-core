import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import ETHCoin from '../../coins/collection/ETHCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'ETH';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(ETHCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getGasPrice').mockReturnValue(Promise.resolve('1001000538'));
generateWalletTests(wallet);
//# sourceMappingURL=ETHCoin.test.js.map