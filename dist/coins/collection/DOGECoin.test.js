import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import DOGECoin from '../../coins/collection/DOGECoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'DOGE';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(DOGECoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getFee').mockReturnValue(Promise.resolve(new wallet.BN('45630')));
generateWalletTests(wallet);
//# sourceMappingURL=DOGECoin.test.js.map