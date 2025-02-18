export default class TerraClassicFCDExplorer extends Explorer {
    constructor(...args: any[]);
    network: string;
    getTransactionsUrl(): string;
    getTransactionsParams(address: any, offset: any, limit: any): {
        account: any;
        offset: any;
        limit: any;
    };
    modifyLatestBlockResponse(response: any): any;
    getGasPrices(): Promise<object>;
    getCosmosTxType(tx: any): void;
    getTxType(tx: any): any;
    getTxDenom(tx: any): any;
    getTxCoins(selfAddress: any, tx: any): any;
    getTxAssetId(asset: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxFee(tx: any): any;
    getTickerFromDenom(denom: any): any;
    modifyTransactionsResponse({ txs }: {
        txs: any;
    }, selfAddress: any): Promise<(never[] | {
        ticker: any;
        name: any;
        walletid: any;
        txType: any;
        txid: any;
        direction: boolean;
        otherSideAddress: any;
        amount: any;
        datetime: Date;
        memo: any;
        alias: any;
        fee: any;
        feeTicker: any;
        confirmations: number;
    } | null)[] | null>;
}
import Explorer from '../../explorers/explorer.js';
