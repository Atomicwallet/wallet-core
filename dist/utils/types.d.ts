import { Numeric } from '../abstract/index.js';
import { ExplorerConfig } from '../explorers/types/index.js';
export type Construct = {
    constructor: {
        name: string;
    };
};
export interface IKeys {
    seed: Buffer;
    phrase: string;
    mnemonic?: string;
}
export interface IKeysObject {
    address: string;
    id: string;
    privateKey: string;
    balance?: string;
}
export interface IConfigFeeData {
    coefficient: number;
    feePerByte: string;
}
export interface IConfig {
    className: string;
    explorers: ExplorerConfig[];
    feeData: IConfigFeeData;
    feesEstimateUrl: string;
    id: string;
    name: string;
    ticker: string;
    txWebUrl: string;
}
export interface IAddrCacheElement {
    id: string;
    ticker: string;
    type: string;
    address: string;
}
export type GetFeeArgs = {
    feePerByte: Numeric;
    userGasPrice: Numeric;
    utxos: Array<Record<string, number>>;
    gasLimit: Numeric;
    address: string;
    sendAmount: Numeric;
    isToken: boolean;
    contract: string;
    denom: string | Numeric;
    custom: unknown;
};
