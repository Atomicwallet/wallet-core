export default EOSNodeExplorer;
declare class EOSNodeExplorer extends Explorer {
    /**
     * Get accounts for public_key
     * @param publicKey
     * @returns {Promise<*>}
     */
    getKeyAccounts(publicKey: any): Promise<any>;
    checkAccountName(account: any): Promise<boolean>;
    getInfoParams(address: any): {
        code: any;
        account: any;
    };
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {
        pos: number;
        offset: number;
        account_name: any;
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    getTxMemo(tx: any): any;
    sendTransaction(rawtx: any, privateKey: any): Promise<{
        txid: any;
        error?: undefined;
    } | {
        error: string;
        txid?: undefined;
    }>;
    getAccount(address: any): Promise<object>;
    getTxFee(): number;
}
import Explorer from '../../explorers/explorer.js';
