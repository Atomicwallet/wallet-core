export default ArkExplorer;
declare class ArkExplorer extends Explorer {
    handleRequestError(error: any, reqArgs: any): object;
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: any;
        nonce: any;
    };
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {
        limit: any;
        orderBy: string;
        page: number;
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    getSendTransactionParams(rawtx: any): {
        transactions: any[];
    };
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
