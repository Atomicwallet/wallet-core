export default KabutoExplorerV2;
/**
 * Class KabutoExplorerV2.
 *
 */
declare class KabutoExplorerV2 extends Explorer {
    getInfo(address: any): Promise<{
        balance: any;
        transactions: never[];
    }>;
    getTransactionsUrl(address: any): string;
    getTxValue(selfAddress: any, tx: any): string;
    /**
     * Gets the transaction datetime.
     *
     * @param {Object} transaction
     * @return {Date} The transaction datetime.
     */
    getTxDateTime(tx: any): Date;
    /**
     * Gets the transaction direction
     *
     * @param {String} wallet address
     * @param {Object} transaction
     * @return {Boolean} The transaction direction.
     */
    getTxDirection(selfAddress: any, tx: any): boolean;
    /**
     * Gets the transaction hash id
     *
     * @param {Object} transaction
     * @return {String} hash id
     */
    getTxHash(tx: any): string;
    getTxMemo(tx: any): any;
    /**
     * Return transfer from transaction transfers array
     *
     *
     * @param {String} Exclusion address. The method will return the address of
     * the other side if the parameter contains its own address
     * @param {Object} transaction
     * @return {Object} transfer
     */
    getTransferFromTx(excludedAddress: any, tx: any): Object;
    /**
     * Return transfer from transaction transfers array
     *
     * @param {String} self address
     * @param {Object} transaction
     * @return {String} opposite address
     */
    getTxOtherSideAddress(selfAddress: any, tx: any): string;
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
