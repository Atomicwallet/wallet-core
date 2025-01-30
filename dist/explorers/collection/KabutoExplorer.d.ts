export default KabutoExplorer;
declare class KabutoExplorer extends Explorer {
    getInfo(address: any): Promise<{
        balance: any;
        transactions: never[];
    }>;
    getTxValue(selfAddress: any, tx: any): string;
    getTxDateTime(tx: any): Date;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxHash(tx: any): any;
    getTxMemo(tx: any): any;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getTransaction(selfAddress: any, txid: any): Promise<Transaction>;
    getTransactions({ address }: {
        address: any;
    }): Promise<any>;
    modifyTransactionsResponse(response: any, selfAddress: any): any;
    getTxFee(tx: any): string;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
