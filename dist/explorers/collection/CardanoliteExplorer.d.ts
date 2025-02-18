export default CardanoliteExplorer;
declare class CardanoliteExplorer extends Explorer {
    /**
     * Constructs the object.
     *
     * @param {Coin|Token} wallet The wallet
     * @param {String} baseUrl The base url
     * @param {String} webUrl The web url
     */
    constructor(wallet: Coin | Token, baseUrl: string, webUrl: string, submitUrl: any, ...args: any[]);
    submitUrl: any;
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getUTXOUrl(): string;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: any, limit: any): {
        addresses: any[];
        dateFrom: number;
        txLimit: any;
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getSendTransactionParams(rawtx: any): {
        signedTx: string;
        txHash: any;
    };
    modifySendTransactionResponse(response: any, hash: any): {
        txid: any;
    };
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxDate(tx: any): string;
    getTxTime(tx: any): string;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    /**
     * Gets the balance.
     *
     * @returns {Promise<BN>}
     */
    getBalance(address: any): Promise<BN>;
    sendTransaction(rawtx: any): Promise<{
        txid: any;
    }>;
    /**
     * Gets the utxo.
     *
     * @return {Promise} The utxo.
     */
    getUnspentOutputs(address: any): Promise<any>;
}
import Explorer from '../../explorers/explorer.js';
