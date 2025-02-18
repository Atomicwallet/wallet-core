/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
export default class Explorer {
    /**
     * Creates an instance of Explorer.
     * @param {*} config
     * @memberof Explorer
     */
    constructor({ wallet, config }: any);
    config: any;
    defaultTxLimit: any;
    wallet: any;
    socket: {};
    webUrl: any;
    clients: {};
    eventEmitter: import("events")<[never]>;
    txNotifier: TxNotifier;
    canPaginate: boolean;
    lastGetInfoRequestTime: number | null;
    lastGetTxsRequestTime: number | null;
    defaultRequestTimeout: any;
    get name(): string;
    updateParams(config: any): void;
    /**
     * Sets socket client.
     *
     * @param {*} endpoint
     * @memberof Explorer
     */
    setSocketClient(endpoint: any): void;
    /**
     * Sets axios request client.
     */
    setAxiosClient(): void;
    client: import("axios").AxiosInstance | undefined;
    /**
     * @param curAmount { String | Number | BN }
     * @returns {*}
     */
    toBNMinimalUnit(curAmount: string | number | BN): any;
    /**
     * @param minAmount { String | Number | BN }
     * @returns {*}
     */
    toBNCurrencyUnit(minAmount: string | number | BN): any;
    /**
     * Gets the web transaction url.
     *
     * @param {String} txid Transaction ID
     */
    getWebTransactionUrl(txid: string): string;
    /**
     * Gets the allowed tickers.
     *
     * @TODO Remove getAllowedIds methods from child classes
     * @deprecated
     * @return {string[]} List of tickers.
     */
    getAllowedTickers(): string[];
    /**
     * Gets the initialize parameters for axios.
     *
     * @return {Object} The initialize parameters.
     */
    getInitParams(): Object;
    getApiPrefix(): string;
    checkTransaction(selfAddress: any, { coin, address, amount, memo, txid, nonce, fee, feeTicker }: {
        coin: any;
        address: any;
        amount: any;
        memo: any;
        txid: any;
        nonce: any;
        fee: any;
        feeTicker: any;
    }): Promise<Transaction>;
    /**
     * Gets the information about a wallet.
     *
     * @return {Promise<Object>} The information data.
     */
    getInfo(address: any): Promise<Object>;
    /**
     * Gets the information url.
     *
     * @return {String}
     */
    getInfoUrl(address: any): string;
    /**
     * Gets the info method.
     *
     * @return {String}
     */
    getInfoMethod(): string;
    /**
     * Gets the info parameters.
     *
     * @return {Object}
     */
    getInfoParams(address: any): Object;
    /**
     * Gets the info request options
     *
     * @returns {Object}
     */
    getInfoOptions(): Object;
    /**
     * Gets the single transactions request options
     *
     * @returns {Object}
     */
    getTransactionOptions(): Object;
    /**
     * Gets the transactions request options
     *
     * @returns {Object}
     */
    getTransactionsOptions(): Object;
    /**
     * Gets the UTXO request options
     *
     * @returns {Object}
     */
    getUtxoOptions(): Object;
    /**
     * Gets the last block request options
     *
     * @returns {Object}
     */
    getLatestBlockOptions(): Object;
    /**
     * Gets the send request options
     *
     * @returns {Object}
     */
    getSendOptions(): Object;
    /**
     * Modify info response
     *
     * @param {Object} response
     */
    modifyInfoResponse(response: Object): Object;
    /**
     * Gets the transaction info.
     *
     * @param {String} txId The transaction identifier.
     * @return {Promise<Object>} The transaction.
     */
    getTransaction(selfAddress: any, txId: string, tokens?: any[]): Promise<Object>;
    getTransactionModifiedResponse(tx: any, selfAddress: any, asset?: any): {
        explorer: string;
        locktime: any;
    } & {
        ticker: any;
        name: any;
        walletid: any;
        txid: string;
        direction: boolean;
        otherSideAddress: string | boolean;
        amount: number;
        datetime: Date;
        memo: string;
        confirmations: number;
        nonce: string;
        alias: any;
        fee: number;
        feeTicker: any;
        txType: any;
    };
    getTransactionsModifiedResponse(tx: any, selfAddress: any, asset?: any): {
        ticker: any;
        name: any;
        walletid: any;
        txid: string;
        direction: boolean;
        otherSideAddress: string | boolean;
        amount: number;
        datetime: Date;
        memo: string;
        confirmations: number;
        nonce: string;
        alias: any;
        fee: number;
        feeTicker: any;
        txType: any;
    };
    /**
     * Gets the get transaction url.
     *
     * @param {String} txId
     * @abstract
     * @return {String}
     */
    getTransactionUrl(txId: string): string;
    /**
     * Gets the get transaction method name.
     *
     * @return {String}
     */
    getTransactionMethod(): string;
    /**
     * Gets the get transaction params.
     *
     * @param {String} txId
     * @return {Object}
     */
    getTransactionParams(txId: string): Object;
    /**
     * Modify transaction response
     *
     * @param {Object} tx
     * @return {Transaction}
     */
    modifyTransactionResponse(tx: Object, selfAddress: any, asset?: any): Transaction;
    /**
     * Get a transactions list for a wallet
     *
     * @return {Promise<Transaction[]>}
     */
    getTransactions({ address, offset, limit, pageNum }: {
        address: any;
        offset: any;
        limit: any;
        pageNum: any;
    }): Promise<Transaction[]>;
    /**
     * Get transaction list url
     *
     * @abstract
     * @return {String}
     */
    getTransactionsUrl(address: any, offset: any, limit: any, pageNum: any): string;
    /**
     * Get transaction list method
     *
     * @return {String}
     */
    getTransactionsMethod(): string;
    /**
     * Get transaction list params
     *
     * @return {Object}
     */
    getTransactionsParams(address: any, offset: number | undefined, limit: any, pageNum: any): Object;
    /**
     * Modify transaction list response
     *
     * @param {Object[]} txs
     */
    modifyTransactionsResponse(txs: Object[], address: any): Transaction[];
    /**
     * Gets the utxos data.
     */
    getUnspentOutputs(address: any, scriptPubKey: any): Promise<any>;
    /**
     * Gets the utx operating system url.
     *
     * @abstract
     * @return {String}
     */
    getUnspentOutputsUrl(address: any): string;
    /**
     * Gets the unspent outputs method.
     *
     * @return {String}
     */
    getUnspentOutputsMethod(): string;
    /**
     * Gets the utx operating system params.
     *
     * @abstract
     * @return {Object}
     */
    getUnspentOutputsParams(address: any): Object;
    /**
     * Modify unspent outputs response
     */
    modifyUnspentOutputsResponse(address: any, response: any, scriptPubKey: any): any;
    /**
     * Sends a transaction.
     *
     * @param {*} rawtx The rawtx
     * @return {Promise<Object>} The transaction data
     */
    sendTransaction(rawtx: any): Promise<Object>;
    /**
     * Gets the send transaction url.
     *
     * @abstract
     * @return {String}
     */
    getSendTransactionUrl(): string;
    /**
     * Gets the send transaction method.
     *
     * @return {String}
     */
    getSendTransactionMethod(): string;
    /**
     * Gets the send transaction param name.
     *
     * @abstract
     * @return {String}
     */
    getSendTransactionParam(): string;
    /**
     * Gets the send transaction param name.
     *
     * @abstract
     * @return {Object}
     */
    getSendTransactionParams(rawtx: any): Object;
    /**
     * Modify send transaction response
     *
     * @param {Object} response
     */
    modifySendTransactionResponse(response: Object): Object;
    getHeaders(): {};
    /**
     * Handles request errors. Returns fallback response data for recoverable or false
     * errors, throws ExplorerRequestError otherwise.
     *
     * @param {import('axios').AxiosError} error
     * @param {object} req request arguments
     * @param {string} req.url The url
     * @param {string} req.method The method
     * @param {object} req.params The data
     * @param {string} req.type Type of request
     * @param {object} req.options options
     * @throws {ExplorerRequestError}
     * @returns {object}
     */
    handleRequestError(error: import("axios").AxiosError, { url, method, params, type, options }: {
        url: string;
        method: string;
        params: object;
        type: string;
        options: object;
    }): object;
    /**
     * The request to the explorer
     *
     * @param {string} url The url
     * @param {import('axios').Method} method The method
     * @param {object} params The data
     * @param {String} type Type of request
     * @param {object} options Other request options
     * @return {Promise<object>}
     */
    request(url: string, method?: import("axios").Method, params?: object, type?: string, options?: object): Promise<object>;
    /**
     * Modify general response
     *
     * @param {Object} response
     */
    modifyGeneralResponse(response: Object): any;
    /**
     * Return tx nonce
     *
     * @param tx
     * @return {string}
     */
    getTxNonce(tx: any): string;
    /**
     * Gets the transaction fee.
     *
     * @param {Object} tx The transaction response.
     * @return {Number} The transaction fee.
     */
    getTxFee(tx: Object): number;
    /**
     * Gets the transaction amount.
     *
     * @param {Object} tx The transaction
     * @return {Number} The transaction amount.
     */
    getTxValue(address: any, tx: Object): number;
    /**
     * Gets the transaction direction.
     *
     * @param {Object} tx The transaction
     * @return {Boolean} The transaction direction.
     */
    getTxDirection(selfAddress: any, tx: Object): boolean;
    /**
     * Gets the transaction recipient.
     *
     * @param {Object} tx The transaction response.
     * @return {(Boolean|String)} The transaction recipient.
     */
    getTxOtherSideAddress(selfAddress: any, tx: Object): (boolean | string);
    /**
     * Gets the transaction datetime.
     *
     * @param {Object} tx The transaction response
     * @return {Date} The transaction datetime.
     */
    getTxDateTime(tx: Object): Date;
    /**
     * Gets the transaction date.
     *
     * @param {Object} tx The transaction response
     * @return {String} The transaction date.
     */
    getTxDate(tx: Object): string;
    /**
     * Gets the transaction time.
     *
     * @param {Object} tx The transaction response
     * @return {String} The transaction time.
     */
    getTxTime(tx: Object): string;
    /**
     * Gets the transaction confirmations.
     *
     * @param {Object} tx The transaction response.
     * @return {Number} The transaction confirmations.
     */
    getTxConfirmations(tx: Object): number;
    /**
     * Gets the transaction hash.
     *
     * @param {Object} tx The transaction response.
     * @return {String} The transaction hash.
     */
    getTxHash(tx: Object): string;
    /**
     * Gets the transaction memo/payment-id.
     *
     * @param {Object} tx The transaction response
     */
    getTxMemo(tx: Object): string;
    getTxFeeTicker(): any;
    /**
     * Returns defined tx type const
     *
     * @param tx
     * @returns {*|string}
     */
    getTxType(tx: any): any | string;
    /**
     * Gets the balance.
     *
     * @return {Promise<String>}
     */
    getBalance(address: any, useSatoshis?: boolean): Promise<string>;
    /**
     * @return {String}
     */
    getLatestBlockUrl(): string;
    /**
     * @return {String}
     */
    getLatestBlockMethod(): string;
    /**
     * @return {Object}
     */
    getLatestBlockParams(): Object;
    /**
     * @return {Object}
     */
    modifyLatestBlockResponse(response: any): Object;
    /**
     * @return {Promise<Object>}
     */
    getLatestBlock(): Promise<Object>;
    getBlockUrl(): void;
    getBlockMethod(): void;
    getBlockParams(): void;
    getBlockOptions(): void;
    getBlock(hash: any): Promise<any>;
    modifyGetBlockResponse(response: any): any;
    getTxLimit(): any;
    createError(msg: any): Error;
    getSocketTransaction({ address, hash, tokens, type, scriptPubKey }: {
        address: any;
        hash: any;
        tokens: any;
        type: any;
        scriptPubKey: any;
    }): Promise<void>;
    /**
     * Stub for make NFT info url
     *
     * @param {string} contractAddress - Contract address.
     * @param {string} [tokenId] - Token id.
     * @returns {string} - NFT info url.
     * @throws {UndeclaredAbstractMethodError}
     */
    makeNftInfoUrl(contractAddress: string, tokenId?: string): string;
    /**
     * Stub for fetch NFT list
     *
     * @async
     * @param {Object<Coin>} coin
     * @returns {Promise<Object<NftToken>[]>}
     * @throws {UndeclaredAbstractMethodError}
     */
    fetchNftList(coin: Object<Coin>): Promise<Object<NftToken>[]>;
    /**
     * Stub for send NFT to other wallet
     *
     * @async
     * @param {Object<Coin>} coin
     * @param {string} toAddress - destination wallet address.
     * @param {string} [contractAddress] - NFT contract address.
     * @param {string} [tokenId] - Token id.
     * @param {string} [tokenStandard] - Token standard.
     * @param {Object} [options] - Some custom user options.
     * @returns {Promise<{tx: string}>} - Transaction hash.
     * @throws {UndeclaredAbstractMethodError}
     */
    sendNft(coin: Object<Coin>, toAddress: string, contractAddress?: string, tokenId?: string, tokenStandard?: string, options?: Object): Promise<{
        tx: string;
    }>;
}
import { TxNotifier } from '../utils/index.js';
import Transaction from './Transaction.js';
