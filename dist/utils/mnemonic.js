import BitcoreMnemonic from 'bitcore-mnemonic';
const getMnemonicLib = async () => {
    return BitcoreMnemonic;
};
export const initializeMnemonic = async (phrase) => {
    const mnemonic = new BitcoreMnemonic(phrase);
    const generatedPhrase = mnemonic.phrase.toString();
    return { mnemonic: mnemonic.toString(), phrase: generatedPhrase, seed: mnemonic.toSeed() };
};
export const validateMnemonic = async (mnemonic) => {
    return BitcoreMnemonic.isValid(mnemonic);
};
//# sourceMappingURL=mnemonic.js.map