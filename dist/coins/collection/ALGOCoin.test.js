import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import ALGOCoin from '../../coins/collection/ALGOCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'ALGO';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(ALGOCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error typ
jest.spyOn(wallet, 'getLatestBlock').mockReturnValue({
    'consensus-version': 'https://github.com/algorandfoundation/specs/tree/925a46433742afb0b51bb939354bd907fa88bf95',
    fee: 0,
    'genesis-hash': 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
    'genesis-id': 'mainnet-v1.0',
    'last-round': 46037800,
    'min-fee': 1000,
});
generateWalletTests(wallet);
//# sourceMappingURL=ALGOCoin.test.js.map