// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createHash64 } from '../../__tests__/fixtures/common.fixture.js';
import { createCoin } from '../../coins/index.js';
import LUNCCoin from '../../coins/collection/LUNCCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'LUNC';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(LUNCCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getGasPricesList').mockReturnValue(Promise.resolve({
    uluna: '28.325',
}));
jest.spyOn(wallet, 'estimateFeeAndTax').mockReturnValue({
    fee: { gas: '1397796', amount: [{ denom: 'uluna', amount: '39592572' }] },
    tax: { denom: 'uluna', amount: '0' },
});
jest.spyOn(wallet, 'createAndSignTx').mockImplementation((payload) => {
    const sig = createHash64(JSON.stringify(payload));
    return sig;
});
generateWalletTests(wallet);
//# sourceMappingURL=LUNCCoin.test.js.map