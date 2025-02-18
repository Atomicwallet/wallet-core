export default ViewblockExplorer;
declare class ViewblockExplorer extends Explorer {
    constructor(...args: any[]);
    defaultTxLimit: number;
    defaultRequestTimeout: number;
    getWalletAddress(): any;
    getTransactionsUrl(address: any): string;
    getTransactionUrl(txid: any): string;
    getInfoParams(): {
        network: string;
        page: number;
        type: string;
    };
    getInfoOptions(): {
        headers: {
            'X-APIKEY': string;
        };
    };
    getTransactionsOptions(): {
        headers: {
            'X-APIKEY': string;
        };
    };
    getTransactionOptions(): {
        headers: {
            'X-APIKEY': string;
        };
    };
    getUtxoOptions(): {
        headers: {
            'X-APIKEY': string;
        };
    };
    getSendOptions(): {
        headers: {
            'X-APIKEY': string;
        };
    };
    getLatestBlockOptions(): {
        headers: {
            'X-APIKEY': string;
        };
    };
    modifyInfoResponse(response?: any[]): {
        balance: any;
        nonce: any;
    };
    getTransactionsParams(address: any, offset?: number, limit?: number): {
        network: string;
        page: number;
        type: string;
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxConfirmations(tx: any): number;
}
import Explorer from '../../explorers/explorer.js';
