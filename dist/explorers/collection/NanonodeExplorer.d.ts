export default NanonodeExplorer;
declare class NanonodeExplorer extends Explorer {
    /**
     * @returns String
     */
    getBaseUrl(): string;
    /**
     * @param  {} txId
     */
    getTransactionUrl(txId: any): string;
    requestedTxId: any;
    /**
     * All actions are POST with the same URL
     * @returns {'POST'}
     */
    getActionMethod(): "POST";
    /**
     */
    getTransactionsMethod(): "POST";
    /**
     */
    getInfoMethod(): "POST";
    /**
     */
    getTransactionMethod(): "POST";
    /**
     * @param  {{}} tx
     * @returns {{}}
     */
    getSendTransactionParams(tx: {}): {};
    /**
     * @param  {} hash
     * @returns {}
     */
    workGenerateParams(hash: any): any;
    /**
     * @param  {string} address
     * @returns {{
     *  action: "pending",
     *  account: string,
     *  count: string,
     * }}
     */
    pendingTransactionsParams(address: string): {
        action: "pending";
        account: string;
        count: string;
    };
    /**
     * @param  {} hash - block hash
     */
    blockInfoParams(hash: any): {
        action: string;
        hash: any;
        json_block: boolean;
        source: boolean;
    };
    /**
     */
    getInfoParams(address: any): {
        action: string;
        account: any;
        pending: boolean;
        representative: boolean;
    };
    /**
     * @param address
     * @param  {} offset=0
     * @param  {} limit=this.defaultTxLimit
     */
    getTransactionsParams(address: any, offset?: any, limit?: any): {
        action: string;
        account: any;
        count: string;
    };
    /**
     * @param  {} response
     * @returns {}
     */
    modifySendTransactionResponse(response: any): any;
    /**
     * Sends a request to mine tx on node server
     * @param  {} hash
     * @returns String
     */
    workGenerate(hash: any): Promise<any>;
    /**
     * Returns array of pending hash blocks
     */
    getPendingTransactions(address: any): Promise<object>;
    /**
     * @param  {} hash - block hash
     */
    getBlockInfo(hash: any): Promise<object>;
    /**
     * @param  {} response
     */
    modifyInfoResponse(response: any): any;
    /**
     * @param  {} tx
     */
    modifyTransactionResponse(tx: any, selfAddress: any): Transaction;
    /**
     * @param address
     * @param  {} offset=0
     * @param  {} limit=this.defaultTxLimit
     */
    getTransactions({ address, offset, limit, pending }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
        pending: any;
    }): Promise<Transaction[]>;
    modifyTransactionsResponse(txs: any, selfAddress: any, asset: any, pending: any): Transaction[];
    /**
     * @param  {} tx
     */
    getTxHash(tx: any): any;
    /**
     * @param  {} tx
     */
    getTxDirection(selfAddress: any, tx: any): boolean;
    /**
     * @param  {} tx
     */
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    /**
     * @param  {} tx
     */
    getTxValue(selfAddress: any, tx: any): number;
    /**
     * @param  {} tx
     */
    getTxDateTime(tx: any): Date;
    /**
     * @param  {} tx
     */
    getTxConfirmations(tx: any, pending: any): 0 | 1;
    /**
     * @param  {} txId
     */
    getTransaction(selfAddress: any, txId: any): Promise<Transaction>;
    /**
     * Uses nanovault socket api, not the node's one
     * @returns Promise resolves when connection established
     */
    connectSocket(address: any): Promise<any>;
    /**
     * Closes socket connection
     */
    disconnectSocket(): void;
    /**
     * Procsses send event. It may be an event from another
     * account sidechain to our or outgoing transaction from ours to theirs
     * @param  {} sendEvent
     */
    processSendEvent(sendEvent: any, selfAddress: any): Promise<void>;
    /**
     * Proceed the websocket event of incoming tx. That mean we have mined
     * the tx and should update it's hash
     * @param  {} receiveEvent
     */
    processReceiveEvent(receiveEvent: any): Promise<void>;
    getTxFee(): number;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
