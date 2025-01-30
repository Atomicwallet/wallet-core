export default MyMoneroExplorer;
export type MyMoneroLocalAccount = {
    /**
     * - MyMonero Wallet Manager.
     */
    walletManager: WalletManager | null;
    /**
     * - Private keys.
     */
    keys?: {
        privateKeyView: string;
        privateKeySpend: string;
    } | undefined;
    /**
     * - MyMonero Wallet.
     */
    wallet: Wallet | null;
    /**
     * - A sign of whether we are logged in my-monero.
     */
    isLoggedIn: boolean;
};
/**
 * @typedef MyMoneroLocalAccount
 * @property {WalletManager|null} walletManager - MyMonero Wallet Manager.
 * @property {{privateKeyView: string, privateKeySpend: string}} [keys={}] - Private keys.
 * @property {Wallet|null} wallet - MyMonero Wallet.
 * @property {boolean} isLoggedIn - A sign of whether we are logged in my-monero.
 */
/**
 * Class MyMoneroExplorer
 *
 */
declare class MyMoneroExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    });
    baseUrl: string;
    ticker: any;
    /**
     * Sets private keys
     * Must be done first on the finished instance.
     *
     * @param {string} privateKeyView - Private view Key.
     * @param {string} privateKeySpend - Private spend Key.
     */
    setup(privateKeyView: string, privateKeySpend: string): void;
    /**
     * Reactivates the my-monero account on our backend proxy server
     *
     * @returns {Promise<void>}
     * @throws {ExternalError}
     */
    reactivateMyMonero(): Promise<void>;
    /**
     * Gets balance from blockchain
     *
     * @param {string} [address]
     * @returns {Promise<{balance: string | BN}>} - The account balance
     * @throws {ExternalError}
     */
    getInfo(address?: string): Promise<{
        balance: string | BN;
    }>;
    /**
     * Gets estimated fee
     *
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getFee(): Promise<string>;
    /**
     * Send transaction to blockchain
     *
     * @param {MyMoneroTransactionOptions} options - Signed raw transaction
     * @returns {Promise<{txid: string}>} - The transaction id.
     * @throws {ExternalError}
     */
    sendTransaction(options: MyMoneroTransactionOptions): Promise<{
        txid: string;
    }>;
    /**
     * Get a transactions list
     * @param {{address: string}} payload - Payload with address.
     * @return {Promise<Object[]>}
     * @throws {ExternalError}
     */
    getTransactions({ address }?: {
        address: string;
    }): Promise<Object[]>;
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
     * @param {string} [selfAddress] - Self address.
     * @param {object} tx - The transaction response.
     * @return {boolean} - True for incoming transaction.
     */
    getTxDirection(selfAddress?: string, tx: object): boolean;
    /**
     * Gets the transaction recipient address.
     *
     * @param {string} selfAddress - Self address.
     * @param {object} tx - The transaction response.
     * @return {string | null}
     */
    getTxOtherSideAddress(selfAddress: string, tx: object): string | null;
    /**
     * Gets the transaction amount.
     *
     * @param {string} [address]
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxValue(address?: string, tx: object): string;
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
    #private;
}
import Explorer from '../../explorers/explorer.js';
