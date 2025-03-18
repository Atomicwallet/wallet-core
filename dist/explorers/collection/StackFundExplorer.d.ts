export default StackFundExplorer;
declare class StackFundExplorer extends Explorer {
    constructor(...args: any[]);
    defaultTxLimit: number;
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number): {
        page: number;
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxDirection(selfAddress: any, tx: any): boolean | undefined;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxMemo(tx: any): any;
    getTxConfirmations(tx: any): number;
}
import Explorer from '../../explorers/explorer.js';
