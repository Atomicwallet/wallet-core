import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import BTCCoin from '../../coins/collection/BTCCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'BTC';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(BTCCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getFee').mockReturnValue(Promise.resolve(new wallet.BN('45630')));
generateWalletTests(wallet);
//# sourceMappingURL=BTCCoin.test.js.map