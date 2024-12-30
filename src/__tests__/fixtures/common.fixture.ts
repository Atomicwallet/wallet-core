// @ts-ignore no declared types
import BitcoreMnemonic from 'bitcore-mnemonic';

import mapping from './mnemonic_mapping.json';

type mnemonicMappingType = {
  [key: string]: {
    [key: string]: {
      address: string;
      privateKey: string | object;
    };
  };
};

export const mnemonicPhrasesList = Object.keys(mapping);

export const mnemonicSeedsList = mnemonicPhrasesList.map((mnemonicPhrase) =>
  new BitcoreMnemonic(mnemonicPhrase).toSeed(),
);

export const DATA_MESSAGE = 'Signed data message';
export const DATA_STRING = `0x${Buffer.from(DATA_MESSAGE, 'utf8').toString('hex')}`;

export const mnemonicMappingKeys = mapping as mnemonicMappingType;
