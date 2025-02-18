/**
 * Decodes the body message of a token.
 *
 * @param {string} value - The base64-encoded value of the token body message.
 * @returns {{
 *  op: number,
 *  queryId?: number
 *  amount?: string,
 *  destination?: string,
 *  source?: string,
 * }} The decoded token body message.
 */
export function decodeTokenBodyMsg(value: string): {
    op: number;
    queryId?: number;
    amount?: string;
    destination?: string;
    source?: string;
};
export default class TonwebExplorer extends Explorer {
    /**
     * @typedef OwnJettonsWalletsAddressesToTokenUniqueFieldObj
     * @type {{ [ownJettonsWalletsAddress: string]: string}|null}
     */
    /** @type {OwnJettonsWalletsAddressesToTokenUniqueFieldObj} */
    static ownJettonsWalletsAddressesToTokenUniqueFieldObj: {
        [ownJettonsWalletsAddress: string]: string;
    } | null;
    static _getTokenByJettonWalletAddress(jettonWalletAddress: any, tokens: any): any;
    /** @type {ParseFunction} */
    static _parseTokenTx(tx: any, { selfAddress, tokens }: {
        selfAddress: any;
        tokens: any;
    }, shouldCheckDestination?: boolean): {
        source?: undefined;
        destination?: undefined;
        isToken?: undefined;
        amount?: undefined;
        decimal?: undefined;
        symbol?: undefined;
        name?: undefined;
        mint?: undefined;
    } | {
        source: string | undefined;
        destination: any;
        isToken: boolean;
        amount: string | undefined;
        decimal: any;
        symbol: any;
        name: any;
        mint: any;
    };
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    }, ...args: any[]);
    _walletAddress: null;
    /**
     * @type {Object.<string, {isMatch: DetectFunction, parse: ParseFunction}>}
     */
    TX_COINS_INSTRUCTIONS_PARSERS: {
        [x: string]: {
            isMatch: Function;
            parse: Function;
        };
    };
    /**
     * @type {Object.<string, {isMatch: DetectFunction, parse: ParseFunction}>}
     */
    TX_TOKENS_INSTRUCTIONS_PARSERS: {
        [x: string]: {
            isMatch: Function;
            parse: Function;
        };
    };
    provider: import("tonweb/dist/types/providers/http-provider").HttpProvider;
    getJettonWalletAddress(ownerAddressStr: any, jettonMinterAddress: any): Promise<string>;
    _getOwnJettonsWalletsAddressesToTokenUniqueFieldObj(): Promise<{
        [ownJettonsWalletsAddress: string]: string;
    }>;
    /**
     * @typedef DetectFunction
     * @type {function}
     * @param {*} tx
     * @param {string} [selfAddress]
     * @returns {boolean}
     */
    /** @type {DetectFunction} */
    _getIsInCoinTx(tx: any): boolean;
    /** @type {DetectFunction} */
    _getIsOutCoinTx(tx: any, selfAddress: any): boolean;
    /** @type {DetectFunction} */
    _getIsInTokenTx(tx: any): boolean;
    /** @type {DetectFunction} */
    _getIsOutTokenTx(tx: any, selfAddress: any): boolean;
    /**
     * @typedef ParsedResult
     * @type {object}
     * @property {string} source
     * @property {string} destination
     * @property {boolean} isToken
     * @property {number} [decimal]
     * @property {string} [symbol]
     * @property {string} [name]
     * @property {string} [mint]
     */
    /**
     * @typedef ParsePayloadObj
     * @type {object}
     * @property {string} [selfAddress]
     * @property {*} [tokens]
     */
    /**
     * @typedef ParseFunction
     * @type {function}
     * @param {*} tx
     * @param {ParsePayloadObj} [payload]
     * @returns {ParsedResult}
     */
    /** @type {ParseFunction} */
    _parseInCoinTx(tx: any): {
        source: any;
        destination: any;
        amount: any;
    };
    /** @type {ParseFunction} */
    _parseOutCoinTx(tx: any, { selfAddress }: {
        selfAddress: any;
    }): {
        source: any;
        destination: any;
        amount: any;
    };
    /** @type {ParseFunction} */
    _parseInTokenTx(tx: any, payload: any): {
        source?: undefined;
        destination?: undefined;
        isToken?: undefined;
        amount?: undefined;
        decimal?: undefined;
        symbol?: undefined;
        name?: undefined;
        mint?: undefined;
    } | {
        source: string | undefined;
        destination: any;
        isToken: boolean;
        amount: string | undefined;
        decimal: any;
        symbol: any;
        name: any;
        mint: any;
    };
    /** @type {ParseFunction} */
    _parseOutTokenTx(tx: any, payload: any): {
        source?: undefined;
        destination?: undefined;
        isToken?: undefined;
        amount?: undefined;
        decimal?: undefined;
        symbol?: undefined;
        name?: undefined;
        mint?: undefined;
    } | {
        source: string | undefined;
        destination: any;
        isToken: boolean;
        amount: string | undefined;
        decimal: any;
        symbol: any;
        name: any;
        mint: any;
    };
    _getWalletAddress(address: any): null;
    getBalance(address: any): Promise<any>;
    getState(address: any): Promise<any>;
    sendTransaction(boc: any): Promise<Response>;
    _getCoinTxInstruction(tx: any): {
        destination: string;
        source: string;
        isToken: boolean;
        amount: string;
    };
    _getTokenTxInstruction(tx: any): {
        destination: string;
        source: string;
        isToken: boolean;
        amount: string;
        decimal: number;
        symbol: string;
        mint: string;
    };
    modifyTransactionsResponse(txs: any): Promise<any>;
    modifyTokensTransactionsResponse(txs: any): Promise<any>;
    getTransactionsUrl(): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {
        address: any;
        limit: any;
        offset: number;
        include_msg_body: boolean;
    };
    getTransactionsOptions(): {
        headers: {
            'X-API-Key': string;
        };
    };
    getTxDataMsg(tx: any): any;
    getTxFee(tx: any): any;
    getTxConfirmations(): number;
    getTxDateTime(tx: any): Date;
    getTxHash(tx: any): any;
    getTxMemo(tx: any): any;
    /**
     * Gets token balance
     * @param {string} address
     * @param {string} mint
     * @returns {Promise<string|null>}
     */
    getTokenBalance({ address, mint }: string): Promise<string | null>;
    /**
     * Get a transactions list for a wallet
     *
     * @return {Promise<Object[]>}
     */
    getTokenTransactions({ jettonWalletAddress }: {
        jettonWalletAddress: any;
    }): Promise<Object[]>;
}
import Explorer from '../../explorers/explorer.js';
