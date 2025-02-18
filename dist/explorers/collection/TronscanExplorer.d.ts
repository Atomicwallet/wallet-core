export default TronscanExplorer;
/**
 * Class for tronscan explorer.
 *
 */
declare class TronscanExplorer extends Explorer {
    constructor(...args: any[]);
    httpclient: any;
    helper: any;
    defaultTxLimit: number;
    /**
     * Gets the information url.
     *
     * @return {<type>} The information url.
     */
    getInfoUrl(address: any): <type>() => any;
    /**
     * Get transaction list params
     *
     * @return {Object}
     */
    getTransactionsParams(address: any, offset?: number, limit?: number): Object;
    /**
     * Modify information response
     *
     * @return {Object} { description_of_the_return_value }
     */
    modifyInfoResponse(response: any): Object;
    getAccount(address: any): Promise<object>;
    getVotes(address: any): Promise<object>;
    /**
     * Gets the transaction url.
     *
     * @param  {<type>} txId The transmit identifier
     * @return {<type>} The transaction url.
     */
    getTransactionUrl(txId: <type>() => any): <type>() => any;
    /**
     * Gets the transactions.
     *
     * @param  {number} offset The offset (default: 0)
     * @param  {<type>} limit The limit (default: this.defaultTxLimit)
     * @return {Promise} The transactions.
     */
    getTransactions({ address, offset, limit }: number): Promise<any>;
    latestBlock: Object | undefined;
    /**
     * Gets the transactions url.
     *
     * @return {<type>} The transactions url.
     */
    getTransactionsUrl(address: any): <type>() => any;
    /**
     * Modify transactions response
     *
     * @return {<type>} { description_of_the_return_value }
     */
    modifyTransactionsResponse(response: any, address: any, asset?: any): <type>() => any;
    modifyTransactionResponse(tx: any, address: any, asset?: any): Transaction;
    modifyTokenTransactionResponse(tx: any, address: any, asset: any, decimal: any): Transaction;
    /**
     * Modify send transaction response
     *
     * @return {Object} { description_of_the_return_value }
     */
    modifySendTransactionResponse(response: any): Object;
    /**
     * Sends a transaction.
     *
     * @param  {<type>} rawtx The rawtx
     * @return {Promise} { description_of_the_return_value }
     */
    sendTransaction(rawtx: <type>() => any, pk: any): Promise<any>;
    /**
     * Gets a balance from a wallet info.
     *
     * @return {Promise<String>} The balance.
     */
    getBalance(): Promise<string>;
    /**
     * Gets the transmit hash.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit hash.
     */
    getTxHash(tx: <type>() => any): <type>() => any;
    /**
     * Gets the transmit direction.
     *
     * @param  {<type>} tx The transmit
     * @return {<Boolean>} The transmit direction.
     */
    getTxDirection(selfAddress: any, tx: <type>() => any): <Boolean>() => any;
    /**
     * Gets the transmit recipient.
     *
     * @param selfAddress <String> Address
     * @param tx <Object> The transmit
     * @return <String> The transmit recipient.
     */
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    /**
     * Gets the transmit value.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit value.
     */
    getBatchTxValue(selfAddress: any, tx: <type>() => any, decimal?: any): <type>() => any;
    getTxValue(selfAddress: any, tx: any, decimal?: any): any;
    /**
     * Gets the transmit date time.
     *
     * @param  {<type>} tx The transmit
     * @return {Date} The transmit date time.
     */
    getTxDateTime(tx: <type>() => any): Date;
    /**
     * Gets the transmit confirmations.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit confirmations.
     */
    getTxConfirmations(tx: <type>() => any): <type>() => any;
    SHA256(msgBytes: any): any;
    getTokenTransfers(address: any, limit?: number): Promise<object>;
    getTxFee(tx: any): any;
    getTransaction(address: any, tx: any, amount: any, ticker: any, walletid: any, name: any): Transaction;
    getTransactionInfo(txId: any): Promise<object>;
    getTransactionType({ contractType }: {
        contractType: any;
    }): string;
    isFirstTransfer(to: any): Promise<boolean>;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
