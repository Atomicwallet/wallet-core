export default QtumInfoExplorer;
/**
 * Api docs - https://github.com/qtumproject/qtuminfo-api
 */
declare class QtumInfoExplorer extends Explorer {
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {
        offset: number;
        limit: any;
        reversed: boolean;
    };
    getTransactionUrl(txId: any): string;
    modifyTransactionsResponse(response: any): Promise<any[]>;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): any;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    modifyUnspentOutputsResponse(address: any, response: any): any;
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    /**
     * Calculates the balance.
     *
     * @param {Object[]} utxos The utxos
     * @return {BN} The balance.
     */
    calculateBalance(utxos?: Object[]): BN;
}
import Explorer from '../../explorers/explorer.js';
