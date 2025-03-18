// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import XMRCoin from '../../coins/collection/XMRCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'XMR';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(XMRCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getIsSendAllByAmount').mockImplementation((amount) => amount);
generateWalletTests(wallet);
//# sourceMappingURL=XMRCoin.test.js.map