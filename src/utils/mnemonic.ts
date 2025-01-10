import type { IKeys } from './types';

const getMnemonicLib = async (): Promise<any> => {
  return (await import('bitcore-mnemonic')).default;
};

const initializeMnemonic = async (phrase?: string): Promise<IKeys> => {
  const BitcoreMnemonic = await getMnemonicLib();

  const mnemonic = new BitcoreMnemonic(phrase);

  const generatedPhrase = mnemonic.phrase.toString();

  return { mnemonic, phrase: generatedPhrase, seed: mnemonic.toSeed() };
};

const validateMnemonic = async (mnemonic: string): Promise<boolean> => {
  return (await getMnemonicLib()).isValid(mnemonic);
};

export { initializeMnemonic, validateMnemonic, getMnemonicLib };
