export default PurestakeExplorer;
declare class PurestakeExplorer extends Explorer {
    getInfoOptions(): {
        headers: {
            'X-API-Key': string;
        };
    };
    getTransactionsOptions(): {
        headers: {
            'X-API-Key': string;
        };
    };
    getTransactionOptions(): {
        headers: {
            'X-API-Key': string;
        };
    };
    getLatestBlockOptions(): {
        headers: {
            'X-API-Key': string;
        };
    };
    getSendOptions(): {
        headers: {
            'X-API-Key': string;
        };
    };
    modifyInfoResponse(response: any): {
        balance: string;
    };
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {};
    getTransactions(address: any, offset?: number, limit?: any): Promise<import("../Transaction.js").default[]>;
    latestBlock: Object | undefined;
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    getBalance(address: any, coinOnly?: boolean): Promise<any>;
    getSendTransactionParams(rawtx: any): {
        RawTransaction: any;
    };
}
import Explorer from '../../explorers/explorer.js';
