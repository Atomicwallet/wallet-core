export default AlgoExplorer;
declare class AlgoExplorer extends Explorer {
    modifyInfoResponse(response: any): {
        balance: any;
    };
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {};
    getTransactions(address: any, offset?: number, limit?: any): Promise<Transaction[]>;
    handleRequestError(error: any, reqArgs: any): object;
    modifyTransactionsResponse(response: any, address: any): any;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(currentBlock: any, tx: any): number;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
