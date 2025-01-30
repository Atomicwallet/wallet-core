export default ZilliqaAtomicExplorer;
declare class ZilliqaAtomicExplorer extends ZilliqaAbstractExplorer {
    handleRequestError(error: any, reqArgs: any): object;
    getTransactionsModifiedResponse(tx: any, selfAddress: any, asset?: any): {
        txType: string;
    } & {
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
    };
    getTransactionsParams(address: any, offset?: number, limit?: any): {
        address: any;
        limit: any;
        offset: number;
    };
    getTransactionsUrl(address: any): string;
    getTransactionParams(txId: any): {
        txId: any;
    };
    getTransactionUrl(txId: any): string;
    getTxDateTime(tx: any): Date;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxHash(tx: any): any;
    getTxOtherSideAddress(selfAddress: any, tx: any): string;
    getTxType(tx: any): string;
    getTxValue(selfAddress: any, tx: any): any;
    getTxConfirmations(tx: any): 0 | 1;
}
import ZilliqaAbstractExplorer from './ZilliqaAbstractExplorer.js';
