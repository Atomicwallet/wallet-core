import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCosmoMockSignedData } from '../../__tests__/fixtures/common.fixture.js';
import { createCoin } from '../../coins/index.js';
import ATOMCoin from '../../coins/collection/ATOMCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'ATOM';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(ATOMCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'createTransaction').mockImplementation(({ address }) => {
    const { bodyBytes, authInfoBytes, signature } = createCosmoMockSignedData(address);
    return Promise.resolve({
        signed: {
            bodyBytes,
            authInfoBytes,
            chainId: 'cosmoshub-4',
            accountNumber: '1337',
        },
        signature: {
            signature,
        },
    });
});
generateWalletTests(wallet);
//# sourceMappingURL=ATOMCoin.test.js.map