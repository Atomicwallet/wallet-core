// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import VETCoin from '../../coins/collection/VETCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'VET';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(VETCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getLatestBlock').mockReturnValue(Promise.resolve({
    id: '0x013a4c18f853eb057196d8ca65d0ba4d825fce0b5b653b5082a9f1b4497fcfd8',
}));
generateWalletTests(wallet);
//# sourceMappingURL=VETCoin.test.js.map