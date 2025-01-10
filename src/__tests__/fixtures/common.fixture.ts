import { createHash } from 'crypto';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import BitcoreMnemonic from 'bitcore-mnemonic';

import mapping from './mnemonic_mapping.json';

type Utxo = {
  txid: string;
  txId: string;
  vout: number;
  script?: string;
  value: string;
  address: string;
  outputIndex?: number;
  satoshis: number;
};

export type MockData = {
  utxo?: Utxo[];
  tx: string | object;
};

type mnemonicMappingType = {
  // mnemonic
  [key: string]: {
    // wallet ticker
    [key: string]: {
      address: string;
      privateKey: string | object;
      tx: string | object;
    };
  };
};

export const randomNumber = (): string => {
  return String(Math.floor(Math.random() * 30) + 1);
};

export const createHash64 = (salt: string, length = 64) => {
  return createHash('sha256').update(salt).digest('hex').slice(0, length);
};

export const createCosmoMockSignedData = (address: string) => {
  const hash = createHash('sha256').update(address).digest();
  return {
    bodyBytes: hash.slice(0, 32),
    authInfoBytes: hash.slice(32, 64),
    signature: hash.slice(0, 64),
  };
};

export const generateMockUtxo = (address: string, value: string): Utxo[] => {
  return [
    {
      address,
      outputIndex: 1,
      satoshis: Number(value),
      txId: createHash64(address),
      txid: createHash64(address),
      value,
      script: '',
      vout: 1,
    },
    {
      address,
      outputIndex: 0,
      satoshis: Number(value),
      txId: createHash64('atomic'),
      txid: createHash64('atomic'),
      value,
      script: '',
      vout: 0,
    },
  ];
};

export const mnemonicPhrasesList = Object.keys(mapping);

export const mnemonicSeedsList = mnemonicPhrasesList.map((mnemonicPhrase) =>
  new BitcoreMnemonic(mnemonicPhrase).toSeed(),
);

export const DATA_MESSAGE = 'Signed data message';
export const DATA_STRING = `0x${Buffer.from(DATA_MESSAGE, 'utf8').toString('hex')}`;

export const mnemonicMappingKeys = mapping as mnemonicMappingType;
