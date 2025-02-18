export default NearHelperExplorer;
declare class NearHelperExplorer extends Explorer {
    getTransactions(...args: any[]): Promise<import("../Transaction.js").default[]>;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: number | undefined, limit: any, pageNum: any): {
        limit: any;
    };
    modifyTransactionsResponse(txs: any, address: any): import("../Transaction.js").default[];
    getTransactionsModifiedResponse(tx: any, selfAddress: any): {
        ticker: any;
        name: any;
        walletid: any;
        txid: string;
        direction: boolean;
        otherSideAddress: string | boolean;
        amount: number;
        datetime: Date;
        memo: string;
        confirmations: number;
        nonce: string;
        alias: any;
        fee: number;
        feeTicker: any;
        txType: any;
    } | null;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxDateTime(tx: any): Date;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxHash(tx: any): any;
    getTxFee(): null;
    getTxConfirmations(): number;
}
import Explorer from '../../explorers/explorer.js';
