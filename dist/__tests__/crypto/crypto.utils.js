import { initializeMnemonic } from '../../utils/index.js';
import { generateMockUtxo, mnemonicPhrasesList, mnemonicMappingKeys } from '../fixtures/common.fixture.js';
function isJson(value) {
    if (typeof value !== 'string') {
        return false;
    }
    try {
        JSON.parse(value);
        return true;
    }
    catch (e) {
        return false;
    }
}
export function generateWalletTests(wallet) {
    const { id } = wallet;
    describe(`Generate keys and signed tx `, () => {
        describe.each(mnemonicPhrasesList)(`${id} with phrase: %s`, (phrase) => {
            let keys;
            let address;
            let pk;
            beforeEach(async () => {
                const { seed, phrase: mnemonicPhrase } = await initializeMnemonic(phrase);
                keys = await wallet.loadWallet(seed, mnemonicPhrase);
                const mapping = mnemonicMappingKeys[phrase]?.[id];
                address = mapping?.address;
                pk = mapping?.privateKey;
            });
            describe(`Private key tests`, () => {
                test('Key pairs should be generated', () => {
                    expect(keys).toBeDefined();
                });
                test(`Private key should be defined`, () => {
                    expect(pk).toBeDefined();
                });
                test(`Private key should match the expected value`, () => {
                    if (id === 'EOS') {
                        keys.privateKey = JSON.parse(keys.privateKey);
                    }
                    expect(keys.privateKey).toStrictEqual(pk);
                });
            });
            describe(`Address tests`, () => {
                if (id !== 'EOS') {
                    test(`Address should be generated`, () => {
                        expect(address).toBeDefined();
                        expect(keys.address).toBeDefined();
                    });
                    test(`Address should match the expected value`, () => {
                        expect(keys.address).toEqual(address);
                    });
                    test(`Address should not match with private key`, () => {
                        expect(keys.address).not.toEqual(pk);
                    });
                }
            });
        });
        describe('Create signed tx', () => {
            test.each(mnemonicPhrasesList)(`${wallet.ticker} signed tx should match the expected value`, async (phrase) => {
                if (id === 'EOS') {
                    // eos tx sign should be defined in instance first
                    return;
                }
                const mappingKeyElement = mnemonicMappingKeys[phrase]?.[id];
                if (!mappingKeyElement) {
                    throw new Error('Failed to map keys');
                }
                const { address, privateKey, tx } = mappingKeyElement;
                await wallet.setPrivateKey(privateKey, phrase);
                wallet.setAddress(address);
                const amount = wallet.toMinimalUnit('42');
                const utxo = generateMockUtxo(wallet.address, amount);
                if (wallet.getScriptPubKey) {
                    for (const out of utxo) {
                        out.script = (await wallet.getScriptPubKey());
                    }
                }
                if (wallet.id !== 'ADA') {
                    // @ts-expect-error typ
                    jest.spyOn(wallet, 'getUnspentOutputs').mockReturnValue(utxo);
                }
                let signedTx = await wallet.createTransaction({
                    amount,
                    address: wallet.address,
                });
                if (signedTx instanceof Object && !(signedTx instanceof Uint8Array)) {
                    signedTx = JSON.parse(JSON.stringify(signedTx));
                }
                else if (isJson(signedTx)) {
                    // @ts-expect-error typ
                    signedTx = JSON.parse(signedTx);
                }
                else if (signedTx instanceof Uint8Array) {
                    signedTx = Array.from(signedTx);
                }
                // console.log(wallet.address, '\n', JSON.stringify(signedTx));
                expect(signedTx).toStrictEqual(tx);
            }, 30000);
        });
    });
}
//# sourceMappingURL=crypto.utils.js.map