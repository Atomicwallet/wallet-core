export default BlockbookV2Explorer;
declare class BlockbookV2Explorer extends Explorer {
    constructor(...args: any[]);
    version: number;
    getSocketTransaction({ address, hash, scriptPubKey }: {
        address: any;
        hash: any;
        scriptPubKey: any;
    }): Promise<void>;
    getNnTickers(): string[];
    getBlockUrl(hash: any): string;
    getBlockMethod(): string;
    getBlockParams(): {};
    getBlockOptions(): {};
    getAddressUrl(address: any): string;
    getInfoOptions(): any;
    getUserTokenListParams(): {};
    getTransactionsOptions(): {
        headers: {
            'api-key': string;
        };
    } | {
        headers?: undefined;
    };
    getInfoParams(): any;
    modifyInfoResponse(response: any): {
        balance: any;
        tokenBalances: {};
        unconfirmedBalance: any;
        transactions: never[];
    };
    getTransactionUrl(txId: any): string;
    getTransactionParams(): any;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: number | undefined, limit: any, pageNum: any): any;
    /**
     * Get specific smart-contract transactions for a wallet
     *
     * @return {Promise<Object[]>}
     */
    getTokenTransactions({ address, offset, limit, pageNum, contract }: {
        address: any;
        offset: any;
        limit: any;
        pageNum: any;
        contract: any;
    }): Promise<Object[]>;
    getTokenTransactionsParams(address: any, offset: any, limit: any, pageNum: any, contract: any): any;
    modifyTransactionResponse(response: any, address: any): any;
    modifyTransactionsResponse(response: any, selfAddress: any): Transaction[] | {
        transactions: Transaction[];
        failed: any;
        tokenTransactions: any;
    } | {
        transactions: Transaction[];
        failed: any;
        tokenTransactions?: undefined;
    };
    modifyTokenTransactionsResponse(response: any, selfAddress: any): any;
    filterTokenTransferTransactions(selfAddress: any, transfer: any): boolean;
    getTransactionFromTokenTransfer({ transfer, selfAddress, tx }: {
        transfer: any;
        selfAddress: any;
        tx: any;
    }): Transaction;
    getUnspentOutputsParams(address: any): any;
    getSendTransactionParams(rawtx: any): any;
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    /**
     * Gets the transaction amount.
     *
     * @param {Object} tx The transaction
     * @return {String} The transaction amount.
     */
    getTxValue(selfAddress: any, tx: Object): string;
    getTxNonce(tx: any): any;
    /**
     * Calculates the balance.
     *
     * @param {Object[]} utxos The utxos
     * @return {BN} The balance.
     */
    calculateBalance(utxos?: Object[]): BN;
    /**
     * Returns user token list data
     * @param {String} address
     * @returns {Array}
     */
    getUserTokenList(address: string): any[];
    getBannedTokensList(): Promise<never[]>;
    getNonce(address: any): Promise<any>;
    getTokensInfo(): number;
    getTokenBalanceByContractAddress({ info, tokenTicker }: {
        info: any;
        tokenTicker: any;
    }): any;
    getTransactionUnmodified(txId: any): Promise<object>;
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
