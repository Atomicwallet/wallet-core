// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import FTMCoin from '../../coins/collection/FTMCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'FTM';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(FTMCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getGasPrice').mockReturnValue('2157509223');
generateWalletTests(wallet);
//# sourceMappingURL=FTMCoin.test.js.map