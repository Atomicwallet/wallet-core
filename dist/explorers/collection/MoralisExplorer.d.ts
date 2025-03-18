export default MoralisExplorer;
/**
 * Class MoralisExplorer.
 *
 */
declare class MoralisExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    });
    chain: any;
    getInfo(address: any, isSpamNftsEnabled: any): Promise<any>;
    /**
     * Gets is ApiKey required sign
     *
     * @param (string) baseUrl
     * @returns {boolean}
     */
    getIsApiKeyRequired(baseUrl: any): boolean;
    getInitParams(): {
        headers: {
            accept: string;
        };
        constructor: Function;
        toString(): string;
        toLocaleString(): string;
        valueOf(): Object;
        hasOwnProperty(v: PropertyKey): boolean;
        isPrototypeOf(v: Object): boolean;
        propertyIsEnumerable(v: PropertyKey): boolean;
    };
    getInfoParams(address: any, chain: any, isSpamNftsEnabled: any): {
        chain: any;
        format: string;
        exclude_spam: boolean;
    };
    /**
     * @typedef {Object} FetchRawListResponse
     * @param {string} contractAddress - NFT contract address.
     * @param {string} tokenId - NFT token id.
     * @param {string} tokenStandard - NFT standard.
     * @param {string} name - NFT name.
     * @param {string} description - NFT description.
     * @param {string} imageUrl - Url to NFT image.
     */
    /**
     *
     * @async
     * @param {Object} response
     * returns {Promise<FetchRawListResponse[]>}
     * @throws {ExternalError}
     * @throws {InternalError}
     */
    modifyInfoResponse(response: Object): Promise<any>;
    /**
     * Fix token standard to specification values
     * Returns the value UNRECOGNIZED_TOKEN_STANDARD if it doesn't match the predefined values.
     *
     * @param {string} rawTokenStandard
     * @returns {string|Symbol}
     */
    fixTokenStandard(rawTokenStandard: string): string | Symbol;
    /**
     * Fetch Ethereum NFT list
     *
     * @async
     * @param {Object<Coin>} coin
     * @param {boolean} isSpamNftsEnabled
     * @returns {Promise<ETHNftToken[]>}
     * @throws {ExternalError} - Throws error receiving NFT list
     */
    fetchNftList(coin: Object<Coin>, isSpamNftsEnabled: boolean): Promise<ETHNftToken[]>;
    /**
     * @typedef RawTokenTransactions
     * @type {object}
     * @property {string} contract - Token contract.
     * @property {string} alias
     * @property {string} explorer
     * @property {string} txid
     * @property {boolean} direction
     * @property {string} otherSideAddress
     * @property {string} value
     * @property {Date} datetime
     * @property {string} memo
     * @property {number} confirmations
     */
    /**
     * @typedef RawTokenTransactionsResponse
     * @type {object}
     * @property {number} total - Total transactions.
     * @property {number} page - Counted from zero.
     * @property {number} pageSize - Transactions on page.
     * @property {string|null} cursor - Every request will return a cursor that can be used to get the next result until
     * there are no more results to return.
     * @property {RawTokenTransactions[]} rawTokenTransactions
     */
    /**
     * Get specific smart-contract token transactions for a wallet
     *
     * @param {string} address - Wallet address.
     * @param {number} [limit=this.defaultTxLimit] - Page limit.
     * @param {string|null} [cursor=null] - Cursor.
     * @return {Promise<RawTokenTransactionsResponse>}
     */
    getRawTokenTransactions({ address, limit, cursor }: string): Promise<{
        /**
         * - Total transactions.
         */
        total: number;
        /**
         * - Counted from zero.
         */
        page: number;
        /**
         * - Transactions on page.
         */
        pageSize: number;
        /**
         * - Every request will return a cursor that can be used to get the next result until
         * there are no more results to return.
         */
        cursor: string | null;
        rawTokenTransactions: {
            /**
             * - Token contract.
             */
            contract: string;
            alias: string;
            explorer: string;
            txid: string;
            direction: boolean;
            otherSideAddress: string;
            value: string;
            datetime: Date;
            memo: string;
            confirmations: number;
        }[];
    }>;
    /**
     * Gets token transactions url
     *
     * @param {string} address  - Wallet address.
     * @returns {string}
     */
    getTokenTransactionsUrl(address: string): string;
    /**
     * Gets token transactions params
     *
     * @param {number} pageLimit - Page limit.
     * @param {string} [cursor] - Every request will return a cursor that can be used to get the next result until
     * there are no more results to return.
     * @return {{chain: string, limit: number, cursor: string}}
     */
    getTokenTransactionsParams(pageLimit: number, cursor?: string): {
        chain: string;
        limit: number;
        cursor: string;
    };
    /**
     * Modifies response to get raw token transactions
     *
     * @param {object} response
     * @param {string} selfAddress - Wallet address.
     * @returns {RawTokenTransactionsResponse}
     */
    modifyRawTokenTransactionsResponse(response: object, selfAddress: string): {
        /**
         * - Total transactions.
         */
        total: number;
        /**
         * - Counted from zero.
         */
        page: number;
        /**
         * - Transactions on page.
         */
        pageSize: number;
        /**
         * - Every request will return a cursor that can be used to get the next result until
         * there are no more results to return.
         */
        cursor: string | null;
        rawTokenTransactions: {
            /**
             * - Token contract.
             */
            contract: string;
            alias: string;
            explorer: string;
            txid: string;
            direction: boolean;
            otherSideAddress: string;
            value: string;
            datetime: Date;
            memo: string;
            confirmations: number;
        }[];
    };
    /**
     * Gets the token transaction direction.
     *
     * @param {string} selfAddress - Wallet address.
     * @param {object} tx - The transaction response.
     * @return {boolean} - True if we accept transaction.
     */
    getTokenTxDirection(selfAddress: string, tx: object): boolean;
    /**
     * Returns user token list data
     * @param {string} address
     * @returns {object[]}
     */
    getUserTokenList(address: string): object[];
    /**
     * Modifies user's token list
     *
     * @param results
     * @returns {object[]}
     */
    modifyUserTokenList(results?: any[]): object[];
    /**
     * Gets token transactions url
     *
     * @param {string} address  - Wallet address.
     * @returns {string}
     */
    getUserTokenListUrl(address: string): string;
    /**
     * @typedef NftTransaction
     * @type {object}
     * @property {string} ticker
     * @property {string} name - Wallet name.
     * @property {string} alias
     * @property {string} walletid - Wallet id.
     * @property {string} explorer - Explorer name.
     * @property {string} contract - NFT token contract.
     * @property {'ERC-721'|'ERC-1155'} contractType
     * @property {number} tokenId
     * @property {string} txid - Transaction hash.
     * @property {boolean} direction
     * @property {string} otherSideAddress
     * @property {Date} datetime
     * @property {string} memo
     * @property {1} confirmations
     * @property {string} txType
     * @property {true} isNft
     * @property {'NFT'} amount - Fake NFT amount.
     */
    /**
     * @typedef NftTransactionsResponse
     * @type {object}
     * @property {number} total - Total transactions.
     * @property {number} page - Counted from zero.
     * @property {number} pageSize - Transactions on page.
     * @property {string|null} cursor - Every request will return a cursor that can be used to get the next result until
     * there are no more results to return.
     * @property {NftTransaction[]} rawTokenTransactions
     */
    /**
     * Get nft transactions for a wallet
     *
     * @param {string} address - Wallet address.
     * @param {number} [limit=this.defaultTxLimit] - Page limit.
     * @param {string|null} [cursor=null] - Cursor.
     * @return {Promise<NftTransactionsResponse>}
     */
    getNftTransactions({ address, limit, cursor }: string): Promise<{
        /**
         * - Total transactions.
         */
        total: number;
        /**
         * - Counted from zero.
         */
        page: number;
        /**
         * - Transactions on page.
         */
        pageSize: number;
        /**
         * - Every request will return a cursor that can be used to get the next result until
         * there are no more results to return.
         */
        cursor: string | null;
        rawTokenTransactions: {
            ticker: string;
            /**
             * - Wallet name.
             */
            name: string;
            alias: string;
            /**
             * - Wallet id.
             */
            walletid: string;
            /**
             * - Explorer name.
             */
            explorer: string;
            /**
             * - NFT token contract.
             */
            contract: string;
            contractType: "ERC-721" | "ERC-1155";
            tokenId: number;
            /**
             * - Transaction hash.
             */
            txid: string;
            direction: boolean;
            otherSideAddress: string;
            datetime: Date;
            memo: string;
            confirmations: 1;
            txType: string;
            isNft: true;
            /**
             * - Fake NFT amount.
             */
            amount: "NFT";
        }[];
    }>;
    /**
     * Gets nft transactions url
     *
     * @param {string} address  - Wallet address.
     * @returns {string}
     */
    getNftTransactionsUrl(address: string): string;
    /**
     * Gets nft transactions params
     *
     * @param {number} pageLimit - Page limit.
     * @param {string} [cursor] - Every request will return a cursor that can be used to get the next result until
     * there are no more results to return.
     * @return {{chain: string, limit: number, format: 'decimal', direction: 'both', cursor: string}}
     */
    getNftTransactionsParams(pageLimit: number, cursor?: string): {
        chain: string;
        limit: number;
        format: "decimal";
        direction: "both";
        cursor: string;
    };
    /**
     * Modifies response to get raw token transactions
     *
     * @param {object} response
     * @param {string} selfAddress - Wallet address.
     * @returns {NftTransactionsResponse}
     */
    modifyNftTransactionsResponse(response: object, selfAddress: string): {
        /**
         * - Total transactions.
         */
        total: number;
        /**
         * - Counted from zero.
         */
        page: number;
        /**
         * - Transactions on page.
         */
        pageSize: number;
        /**
         * - Every request will return a cursor that can be used to get the next result until
         * there are no more results to return.
         */
        cursor: string | null;
        rawTokenTransactions: {
            ticker: string;
            /**
             * - Wallet name.
             */
            name: string;
            alias: string;
            /**
             * - Wallet id.
             */
            walletid: string;
            /**
             * - Explorer name.
             */
            explorer: string;
            /**
             * - NFT token contract.
             */
            contract: string;
            contractType: "ERC-721" | "ERC-1155";
            tokenId: number;
            /**
             * - Transaction hash.
             */
            txid: string;
            direction: boolean;
            otherSideAddress: string;
            datetime: Date;
            memo: string;
            confirmations: 1;
            txType: string;
            isNft: true;
            /**
             * - Fake NFT amount.
             */
            amount: "NFT";
        }[];
    };
}
import Explorer from '../../explorers/explorer.js';
import { ETHNftToken } from '../../coins/nfts/index.js';
