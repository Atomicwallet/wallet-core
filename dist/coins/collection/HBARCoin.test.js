import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import HBARCoin from '../../coins/collection/HBARCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'HBAR';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(HBARCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @todo proper tx mocks should be defined
// @ts-expect-error typ
jest.spyOn(wallet, 'createTransaction').mockImplementation(({ address, amount }) => {
    return { address, amount };
});
generateWalletTests(wallet);
//# sourceMappingURL=HBARCoin.test.js.map