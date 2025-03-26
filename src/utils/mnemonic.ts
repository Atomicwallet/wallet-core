import BitcoreMnemonic from 'bitcore-mnemonic';

import type { IKeys } from './types';

const getMnemonicLib = async (): Promise<any> => {
  return BitcoreMnemonic;
};

export const initializeMnemonic = async (phrase?: string): Promise<IKeys> => {
  const mnemonic = new BitcoreMnemonic(phrase);

  const generatedPhrase = mnemonic.phrase.toString();

  return { mnemonic: mnemonic.toString(), phrase: generatedPhrase, seed: mnemonic.toSeed() };
};

export const validateMnemonic = async (mnemonic: string): Promise<boolean> => {
  return BitcoreMnemonic.isValid(mnemonic);
};
