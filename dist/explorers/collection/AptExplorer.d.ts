export default AptExplorer;
export type GasPriceResponse = {
    deprioritized_gas_estimate: number;
    gas_estimate: number;
    prioritized_gas_estimate: number;
};
/**
 * @typedef GasPriceResponse
 * @property {number} deprioritized_gas_estimate
 * @property {number} gas_estimate
 * @property {number} prioritized_gas_estimate
 */
declare class AptExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    });
    baseUrl: string;
    ticker: any;
    aptosClient: AptosClient;
    coinClient: CoinClient;
    /**
     * Gets an account from the blockchain at its address
     *
     * @async
     * @param {string} address
     * @returns {Promise<AccountData>}
     */
    getAccount(address: string): Promise<AccountData>;
    /**
     * Send transaction to blockchain
     *
     * @param {Uint8Array} bcsTxn - Signed raw transaction
     * @returns {Promise<{txid: string}>} - The transaction id.
     * @throws {ExternalError}
     */
    sendTransaction(bcsTxn: Uint8Array): Promise<{
        txid: string;
    }>;
    /**
     * @typedef GetInfoResponse
     * @property {string | BN | null} balance - The null means no balance.
     * @property {boolean} isRegistered - The sign that the account is registered on the blockchain.
     */
    /**
     * Gets balance from blockchain
     *
     * @param {string} [address]
     * @returns {Promise<GetInfoResponse>} - The account balance
     * @throws {ExternalError}
     */
    getInfo(address?: string): Promise<{
        /**
         * - The null means no balance.
         */
        balance: string | BN | null;
        /**
         * - The sign that the account is registered on the blockchain.
         */
        isRegistered: boolean;
    }>;
    handleRequestError(error: any, reqArgs: any): object;
    /**
     * Gets estimated gas price
     *
     * @async
     * @returns {Promise<{GasPriceResponse}>}
     */
    getGasPrice(): Promise<{
        GasPriceResponse: any;
    }>;
    /**
     * Gets transaction list params
     *
     * @param {number} offset
     * @param {number} [limit]
     * @param {number} [pageNum]
     * @return {start: string, limit: string}
     */
    getTransactionsParams(address: any, offset?: number, limit?: number, pageNum?: number): start;
    /**
     * Gets transaction url
     *
     * @param {string} address
     * @returns {string}
     */
    getTransactionsUrl(address: string): string;
    /**
     * Gets the transaction hash.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxHash(tx: object): string;
    /**
     * Gets the transaction direction.
     *
     * @param {object} tx - The transaction response.
     * @return {boolean} - True if we accept transaction.
     */
    getTxDirection(selfAddress: any, tx: object): boolean;
    /**
     * Gets the transaction recipient address.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxOtherSideAddress(selfAddress: any, tx: object): string;
    /**
     * Gets the transaction amount.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxValue(address: any, tx: object): string;
    /**
     * Gets the transaction datetime.
     *
     * @param {object} tx - The transaction response.
     * @return {Date}
     */
    getTxDateTime(tx: object): Date;
    /**
     * Gets the transaction fee.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxFee(tx: object): string;
    /**
     * Gets the transaction confirmations.
     *
     * @param {object} tx - The transaction response.
     * @return {number} The transaction confirmations.
     */
    getTxConfirmations(tx: object): number;
    #private;
}
import Explorer from '../../explorers/explorer.js';
import { AptosClient } from 'aptos';
import { CoinClient } from 'aptos';
