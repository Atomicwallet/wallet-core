import { ExplorerConfig } from '../explorers/types/index.js';
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
