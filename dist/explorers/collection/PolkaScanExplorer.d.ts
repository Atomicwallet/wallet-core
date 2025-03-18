export default PolkaScanExplorer;
declare class PolkaScanExplorer extends Explorer {
    getInfoParams(address: any): {
        key: any;
        page: number;
        row: number;
    };
    modifyInfoResponse(response: any): {
        balance: number;
        balances: {
            available: any;
            staking: number;
        };
        transactions: any;
        nonce: number;
    };
    getTransactionUrl(txId: any): string;
    getTransactionParams(txId: any): {
        hash: any;
    };
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {
        address: any;
        page: number;
        row: any;
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
