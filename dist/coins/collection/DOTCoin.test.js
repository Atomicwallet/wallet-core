// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import metadata from '../../__tests__/fixtures/dot.metadata.json';
import { createCoin } from '../../coins/index.js';
import DOTCoin from '../../coins/collection/DOTCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'DOT';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(DOTCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
jest.spyOn(wallet, 'getLatestBlock').mockReturnValue({
    number: '24213019',
    hash: '0x73b02b6d39ec12e5068d7f3468aa1a8812d4413cdbadcc0fd07d64122da6e952',
});
jest.spyOn(wallet, 'getTxMeta').mockReturnValue({
    genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    specVersion: 9320,
    txVersion: 7,
    specName: 'polkadot',
    chainName: 'Polkadot',
});
jest.spyOn(wallet, 'getMetadata').mockReturnValue(metadata);
// compare signing payload instead of signed tx, cause sr25519 uses randomized signer each iteration
jest.spyOn(wallet, 'sign').mockImplementation(({ signingPayload }) => {
    return signingPayload;
});
wallet.nonce = 1;
generateWalletTests(wallet);
//# sourceMappingURL=DOTCoin.test.js.map