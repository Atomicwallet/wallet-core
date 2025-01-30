export default HasTokensMixin;
declare function HasTokensMixin(superclass: any): {
    new (args: any): {
        [x: string]: any;
        tokens: {};
        /**
         * @param  {} txn - transaction context
         * @param  {} items - tokens to insert
         * @returns {Promise<items>} - items was inserted
         */
        _insertBatchTokens(items: any): Promise<any>;
        _updateBatchTokens(tokens: any): Promise<any>;
        _updateToken(token: any): Promise<any>;
        _removeToken(uniqueField: any): Promise<void>;
        /**
         * @param  {} parentTicker - tokens of what coin?
         * @returns {Promise<tokens>}  - an object with selected tokens rows
         */
        loadTokensFromDb(parentTicker: any, filterFun?: (token: any) => boolean): Promise<tokens>;
        /**
         * @param  {Array<Token{}>} tokens - array of token object to insert
         * @returns {Promise<tokens>} - inserted tokens
         */
        insertTokensToDb(tokens: any): Promise<any>;
        /**
         * @param  {Array<Token{}>} tokens - array of token object to update
         * @returns {Promise<updatedTokens>} - updated tokens
         */
        updateTokensInDb(tokens: any, initialSource: any): Promise<updatedTokens>;
        /**
         * @param  {String} token uniqueField
         * @returns {Promise<>}
         */
        removeTokenFromDb(uniqueField: any): Promise<any>;
        /**
         * Entry point 1:
         * - Called from Wallets.js
         * - Called immediately after start of the application
         * @param  {Array<Coin>} wallets - list of coins to push generated tokens
         * @throws {InternalError}
         * @returns {Promise{Array<String>}} - List of token tickers strings
         */
        loadTokensList(wallets: Array<Coin>): Promise<any>;
        bannedTokens: any[] | undefined;
        /**
         * Entry point 2:
         * - Called from Wallets.js
         * - Called after the user had successfully logged in
         * At this point we have an address available and can load user token balances
         *
         * @param {*} wallets
         * @returns {undefined}
         */
        fetchUserTokens(wallets: any): undefined;
        /**
         * Set confirmed status for white-list
         * @param tokens
         * @returns {Promise<*>}
         */
        setTokensConfirmation(tokens: any[] | undefined, wallets: any, source: any): Promise<any>;
        /**
         * General processing function
         * 1. Converts server token format to internal token format
         * 2. Applies exclusion filter
         *
         * @param {Array<ServerToken>} serverTokenList - Array of token objects with
         *  external format
         *
         * @param {String} source - 'list' or 'user', defines format of a
         *  serverTokenList
         * - 'list' - list of common tokens for all users
         * - 'user' - list of specific user tokens
         *
         * @returns {Promise<tokens>}
         */
        processTokenList(serverTokenList: Array<ServerToken> | undefined, source: string): Promise<tokens>;
        /**
         * @returns {Promise<Array>} - Unprocessed array of tokens from external
         * service
         */
        getTokenList(): Promise<any[]>;
        getBannedTokenList(): Promise<never[]>;
        /**
         * Used to remove particular token from the list
         * @returns {Array<Array>} - List of token tickers strings
         */
        getExcludedTokenList(): Array<any[]>;
        /**
         * Coin should re-implement this method to provide a list of token objects
         * in server format (list with external server token objects)
         *
         * @returns {Array<ServerToken>} - array of token objects
         */
        getUserTokenList(): Array<ServerToken>;
        /**
         * If needs more complex logic for exclusion, for example spam filtering
         * should be done by re-implementing this method in parent coin
         *
         * @param {*} token - token object
         * @returns {Boolean} - true if excluded
         */
        isTokenExcluded(token: any): boolean;
        /**
         * Convert external server token object to internal token object format
         *
         * @param {*} serverToken
         * @param {*} source
         * @returns {Token} - Token object:
         * {
         *   name: String,      // token name
         *   ticker: String,    // unique ticker of token, should be unique across all
         * coins in the coins list
         *   decimal: Number,   // number of decimals
         *   contract: String   // an address of creator of token
         *  }
         */
        getTokenObject(serverToken: any, source?: any): Token;
        /**
         * Maps from user token list to internal token format
         * Maybe better name for this method is getTokenFromExplorer
         * @TODO Move the conversion to the standard shape into explorers
         * @returns {Promise<Array>}
         */
        getTokenFromUserList(token: any, source: any): Promise<any[]>;
        /**
         * Maps from common token list to internal token format
         * @returns {Promise<Array>}
         */
        getTokenFromCommonList(token: any, source: any): Promise<any[]>;
        /**
         * Updating custom token parameters, such as Name, Ticker, Decimal, Contract
         *
         * @param {*} token to update
         * @param {*} new parameters
         * @returns {Promise<tokens>} - inserted tokens
         * {
         *   name: String,      // token name
         *   ticker: String,    // unique ticker of token, should be unique across all
         * coins in the coins list
         *   decimal: Number,   // number of decimals
         *   contract: String   // an address of creator of token
         *  }
         */
        updateCustomToken(oldToken: any, newParams: any): Promise<tokens>;
        validateCustomToken({ name, ticker, decimal, contract }: {
            name: any;
            ticker: any;
            decimal: any;
            contract: any;
        }): Promise<void>;
        /**
         * Create custom token from provided params
         *
         * @param name
         * @param ticker
         * @param decimals
         * @param contract
         * @param uniqueField
         * @param visibility
         * @returns {Promise<[Token]>}
         */
        createCustomToken({ name, ticker, decimal, contract, uniqueField, source }: {
            name: any;
            ticker: any;
            decimal: any;
            contract: any;
            uniqueField: any;
            source?: string | undefined;
        }, wallets: any): Promise<[Token]>;
        /**
         * Calls for createToken of a coin and pushes the result to wallets
         * - Mutates wallets array
         * - Mutates this.tokens with created tokens
         *
         * @param {*} [tokens=[]]
         * @param {*} wallets
         * @return {any[]}
         */
        createTokens(tokens?: any, wallets: any): any[];
        getUniquesAndDuplicates(tokens: any): Promise<{}[]>;
        deleteDuplicates(tokens: any): Promise<void>;
        bulkDeleteWhereNotInList(listFilter: any): Promise<void>;
    };
    [x: string]: any;
};
import { Token } from '../../abstract/index.js';
