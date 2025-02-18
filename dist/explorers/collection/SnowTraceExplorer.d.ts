export default SnowTraceExplorer;
declare class SnowTraceExplorer extends Explorer {
    getTransactions(...args: any[]): Promise<import("../Transaction.js").default[]>;
    getTransactionsUrl(): string;
    getTransactionsParams(address: any): {
        module: string;
        action: string;
        address: any;
    };
    /**
     * Gets is nft sign
     *
     * @param {object} tx
     * @returns {boolean}
     */
    getIsNftTx(tx: object): boolean;
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    /**
     * Gets the transaction direction.
     *
     * @param {object} tx - The transaction response.
     * @return {boolean} - True if we accept transaction.
     */
    getTxDirection(selfAddress: any, tx: object): boolean;
    /**
     * Gets other side address
     *
     * @param {string} selfAddress
     * @param {object} tx - The transaction response.
     * @returns {string}
     */
    getTxOtherSideAddress(selfAddress: string, tx: object): string;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): any;
    getTxNonce(tx: any): any;
    getTxFee(tx: any): any;
    /**
     * Returns defined tx type const
     *
     * @param {object} tx
     * @returns {string}
     */
    getTxType(tx: object): string;
    getTransactionsModifiedResponse(tx: any, selfAddress: any): {
        ticker: any;
        name: any;
        walletid: any;
        txid: any;
        direction: boolean;
        otherSideAddress: string;
        amount: any;
        datetime: Date;
        memo: any;
        confirmations: number;
        nonce: any;
        alias: any;
        fee: any;
        feeTicker: any;
        txType: string;
        isNft: boolean;
    };
    _getGasPrice(): Promise<{
        fastest: any;
        fast: any;
        safeLow: any;
    } | {
        fastest?: undefined;
        fast?: undefined;
        safeLow?: undefined;
    }>;
    getGasPrice: lodash.DebouncedFuncLeading<() => Promise<{
        fastest: any;
        fast: any;
        safeLow: any;
    } | {
        fastest?: undefined;
        fast?: undefined;
        safeLow?: undefined;
    }>>;
    /**
     * @typedef TransactionDecodedInput
     * @type {object}
     * @property {string} method
     * @property {object} params
     * @property {string} params.from
     * @property {string} params.to
     * @property {string} params.tokenId
     */
    /**
     * Decodes transaction input
     *
     * @param {string} input
     * @return {TransactionDecodedInput | null}
     */
    decodeInput(input: string): {
        method: string;
        params: {
            from: string;
            to: string;
            tokenId: string;
        };
    } | null;
}
import Explorer from '../../explorers/explorer.js';
import lodash from 'lodash';
