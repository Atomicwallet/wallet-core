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
    [key: string]: {
        [key: string]: {
            address: string;
            privateKey: string | object;
            tx: string | object;
        };
    };
};
export declare const randomNumber: () => string;
export declare const createHash64: (salt: string, length?: number) => string;
export declare const createCosmoMockSignedData: (address: string) => {
    bodyBytes: Buffer<ArrayBuffer>;
    authInfoBytes: Buffer<ArrayBuffer>;
    signature: Buffer<ArrayBuffer>;
};
export declare const generateMockUtxo: (address: string, value: string) => Utxo[];
export declare const mnemonicPhrasesList: string[];
export declare const mnemonicSeedsList: Buffer<ArrayBufferLike>[];
export declare const DATA_MESSAGE = "Signed data message";
export declare const DATA_STRING: string;
export declare const mnemonicMappingKeys: mnemonicMappingType;
export {};
