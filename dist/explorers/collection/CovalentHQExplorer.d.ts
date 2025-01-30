export default CovalentHQExplorer;
/**
 * Class for explorer.
 *
 * @class {CovalentHQExplorer}
 */
declare class CovalentHQExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    });
    modifyTokenResponse(response: any): any;
    handleRequestError(error: any, reqArgs: any): object | null;
    /**
     *
     * @param {string} address - Wallet address.
     * @returns {Promise<object[]>}
     */
    getUserTokenList(address: string): Promise<object[]>;
    getTransactionsParams(address: any, offset: number | undefined, limit: any, pageNum: any): {
        'page-size': any;
        'page-number': any;
    };
    /**
     * Modify transaction list response
     *
     * @param {object} response
     */
    modifyTransactionsResponse(response: object, address: any): import("../Transaction.js").default[];
    getTransactionsModifiedResponse(tx: any, selfAddress: any, asset?: any): {
        ticker: any;
        name: any;
        walletid: string | null;
        txid: any;
        direction: boolean;
        otherSideAddress: any;
        amount: string | 0 | null;
        datetime: Date;
        memo: string;
        confirmations: number;
        nonce: any;
        alias: any;
        explorer: string;
        txType: string;
        fee: any;
        feeTicker: any;
        isToken: boolean;
        isNft: boolean;
        contract: string | null;
    };
    getTxTicker(event: any): any;
    getTxName(event: any): any;
    /**
     * Gets Tx wallet id
     *
     * @param {object} tx
     * @param {object} event
     * @returns {string|null}
     */
    getTxWalletId(tx: object, event: object): string | null;
    /**
     * Gets the transaction direction.
     *
     * @param {string} selfAddress - The transaction event.
     * @param {object} tx - The transaction.
     * @param {object} event - The transaction event.
     * @return {boolean} - True if we accept transaction.
     */
    getTxDirection(selfAddress: string, tx: object, event: object): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any, event: any): any;
    /**
     * Gets Tx value
     *
     * @param {string} selfAddress
     * @param {object} tx
     * @param {object} event
     * @return {string|0|null}
     */
    getTxValue(selfAddress: string, tx: object, event: object): string | 0 | null;
    /**
     * Gets Tx type
     *
     * @param {object} event
     * @returns {string}
     */
    getTxType(event: object): string;
    getTxIsToken(event: any): boolean;
    getTxIsNft(event: any): boolean;
    /**
     * Gets Tx contract
     *
     * @param {object} tx
     * @param {object} event
     * @returns {string|null}
     */
    getTxContract(tx: object, event: object): string | null;
    /**
     * Gets a token's transaction list for a wallet
     * This method is implemented not to break compatibility with other explorers.
     * The getTransaction method gets the entire history, so here we return an empty array.
     *
     * @return {Promise<{tokenTransactions: object[]}>}
     */
    getTokensTransactions(args: any): Promise<{
        tokenTransactions: object[];
    }>;
    #private;
}
import Explorer from '../../explorers/explorer.js';
