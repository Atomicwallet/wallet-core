// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import TONCoin from '../../coins/collection/TONCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'TON';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(TONCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getSeqno').mockReturnValue(42);
jest.spyOn(wallet, 'getTransactionExpirationTimeout').mockReturnValue(3472834780);
wallet.state = true;
generateWalletTests(wallet);
//# sourceMappingURL=TONCoin.test.js.map