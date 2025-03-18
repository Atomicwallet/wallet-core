// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createHash64 } from '../../__tests__/fixtures/common.fixture.js';
import { createCoin } from '../../coins/index.js';
import LUNACoin from '../../coins/collection/LUNACoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'LUNA';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(LUNACoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'createAndSignTx').mockImplementation((payload) => {
    const sig = createHash64(JSON.stringify(payload));
    return sig;
});
generateWalletTests(wallet);
//# sourceMappingURL=LUNACoin.test.js.map