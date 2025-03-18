export default NeoscanExplorer;
declare class NeoscanExplorer extends Explorer {
    getInfo(address: any): Promise<{
        balance: any;
        balances: {
            available: any;
            rewards: any;
        };
    }>;
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    modifyInfoResponse(response: any): {};
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    filterTransactionList(txList: any, selfAddress: any): any;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    sendTransaction(rawtx: any): Promise<any>;
    getTxFee(tx: any): any;
    getTxFeeTicker(): string;
}
import Explorer from '../../explorers/explorer.js';
