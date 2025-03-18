import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import BSCCoin from '../../coins/collection/BSCCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'BSC';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(BSCCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
wallet.nonce = 1;
jest.spyOn(wallet, 'getGasPrice').mockReturnValue(Promise.resolve('5000000000'));
generateWalletTests(wallet);
//# sourceMappingURL=BSCCoin.test.js.map