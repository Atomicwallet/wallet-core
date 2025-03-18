import axios from 'axios';
import { ExternalError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import { LazyLoadedLib, Emitter as emitter, logger } from '../../utils/index.js';
import { WALLETS } from '../../utils/index.js';
import { getStringWithEnsuredEndChar } from '../../utils/convert.js';
const MymoneroWalletManagerLazyLoaded = new LazyLoadedLib(() => import('@mymonero/mymonero-wallet-manager'));
const ATOMIC_ALIAS = 'atomic';
const MONERO_MAINNET = 'MAINNET';
const INCOMING_TRANSACTION_SIGN = 'incoming';
// The response status of our internal proxy (only for the "/activate_account" URL) means
// that the account was not found, which means a new entry.
const HTTP_STATUS_NOT_FOUND = 404;
// Response status of our backend proxy server meaning that the account has been deactivated.
const HTTP_STATUS_DEACTIVATED = 409;
const ATOMIC_ID_HEADER_NAME = 'x-atomic-id';
const MY_MONERO_PROXY_REACTIVATE_URL = '/activate_account';
const MY_MONERO_PROXY_REACTIVATE_URL_TEST_PATTERN = /^\/?activate_account$/;
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
class MyMoneroExplorer extends Explorer {
    /** @type string | undefined */
    #atomicId;
    /** @type MyMoneroLocalAccount */
    #myMoneroLocalAccount = {
        walletManager: null,
        keys: {},
        wallet: null,
        isLoggedIn: false,
    };
    constructor({ wallet, config }) {
        super({ wallet, config });
        this.baseUrl = getStringWithEnsuredEndChar(config.baseUrl, '/');
        this.ticker = wallet.ticker;
        this.#atomicId = wallet.atomicId;
    }
    /**
     * Sets private keys
     * Must be done first on the finished instance.
     *
     * @param {string} privateKeyView - Private view Key.
     * @param {string} privateKeySpend - Private spend Key.
     */
    setup(privateKeyView, privateKeySpend) {
        this.#myMoneroLocalAccount.keys = { privateKeyView, privateKeySpend };
    }
    /**
     * Instantiates inits and gets Mymonero WalletManager
     * @returns {Promise<WalletManager>}
     */
    async #initAndGetMyMoneroWalletManager() {
        if (this.#myMoneroLocalAccount.walletManager) {
            return this.#myMoneroLocalAccount.walletManager;
        }
        const axiosInstance = axios.create({ baseURL: this.baseUrl });
        axiosInstance.interceptors.request.use((axiosRequestConfig) => {
            axiosRequestConfig.headers.common[ATOMIC_ID_HEADER_NAME] = this.#atomicId;
            return axiosRequestConfig;
        });
        axiosInstance.interceptors.response.use(null, (axiosResponseError) => {
            const { config: { url }, response: { status }, } = axiosResponseError;
            if (status === HTTP_STATUS_NOT_FOUND && MY_MONERO_PROXY_REACTIVATE_URL_TEST_PATTERN.test(url)) {
                // Do nothing, which means create a new my-monero account by our backend proxy server
                return;
            }
            if (axiosResponseError.response?.status === HTTP_STATUS_DEACTIVATED) {
                emitter.emit(WALLETS.DEACTIVATE_COIN, { id: this.wallet.id });
            }
            return Promise.reject(axiosResponseError);
        });
        const { default: WalletManager } = await MymoneroWalletManagerLazyLoaded.get();
        const walletManager = new WalletManager(MONERO_MAINNET, this.baseUrl);
        // Replace my-monero httpClient with own axios instance to avoid using global axios
        // and to avoid using 'x-atomic-id' header in unrelated requests
        walletManager.apiClient.httpClient = axiosInstance;
        try {
            await new Promise((resolve) => {
                this.#ensureInitialization(walletManager, resolve);
            });
        }
        catch (error) {
            logger.log({ instance: this, error });
        }
        this.#myMoneroLocalAccount.wallet = await walletManager.importWalletKeys(ATOMIC_ALIAS, this.wallet.address, this.#myMoneroLocalAccount.keys.privateKeyView, this.#myMoneroLocalAccount.keys.privateKeySpend);
        this.#myMoneroLocalAccount.walletManager = walletManager;
        return walletManager;
    }
    /**
     * Reactivates the my-monero account on our backend proxy server
     *
     * @returns {Promise<void>}
     * @throws {ExternalError}
     */
    async reactivateMyMonero() {
        const walletManager = await this.#initAndGetMyMoneroWalletManager();
        return walletManager.apiClient.httpClient.post(MY_MONERO_PROXY_REACTIVATE_URL, {
            atomicId: this.#atomicId,
        });
    }
    async #ensureInitialization(walletManager, resolve, counter = 1) {
        const MAX_COUNT = 10;
        if (!walletManager.bridgeClass?.isValidKeys && counter <= MAX_COUNT) {
            await walletManager.init();
            setTimeout(() => this.#ensureInitialization(walletManager, resolve, counter + 1), 10);
            return;
        }
        resolve();
    }
    /**
     * Log in to MyMonero and syncs the state
     *
     * @returns {Promise<{void}>}
     * @throws {Error}
     * @throws {ExternalError}
     */
    async #logInToOrSyncMyMonero() {
        try {
            if (!this.#myMoneroLocalAccount.isLoggedIn) {
                await this.#initAndGetMyMoneroWalletManager();
                await this.#myMoneroLocalAccount.wallet.login(true);
                this.#myMoneroLocalAccount.isLoggedIn = true;
            }
            await this.#myMoneroLocalAccount.wallet.sync();
        }
        catch (error) {
            throw new ExternalError(error, this);
        }
    }
    /**
     * Gets balance from blockchain
     *
     * @param {string} [address]
     * @returns {Promise<{balance: string | BN}>} - The account balance
     * @throws {ExternalError}
     */
    async getInfo(address) {
        await this.#logInToOrSyncMyMonero();
        return { balance: this.#myMoneroLocalAccount.wallet.balance.toString() };
    }
    /**
     * Gets estimated fee
     *
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    async getFee() {
        await this.#logInToOrSyncMyMonero();
        try {
            const fee = await this.#myMoneroLocalAccount.wallet.estimateFee();
            return fee.toString();
        }
        catch (error) {
            throw new ExternalError(error, this);
        }
    }
    /**
     * Send transaction to blockchain
     *
     * @param {MyMoneroTransactionOptions} options - Signed raw transaction
     * @returns {Promise<{txid: string}>} - The transaction id.
     * @throws {ExternalError}
     */
    async sendTransaction(options) {
        await this.#logInToOrSyncMyMonero();
        try {
            const hash = await this.#myMoneroLocalAccount.wallet.transfer(options);
            return { txid: hash };
        }
        catch (error) {
            throw new ExternalError(error, this);
        }
    }
    /**
     * Get a transactions list
     * @param {{address: string}} payload - Payload with address.
     * @return {Promise<Object[]>}
     * @throws {ExternalError}
     */
    async getTransactions({ address } = {}) {
        await this.#logInToOrSyncMyMonero();
        const transactions = this.#myMoneroLocalAccount.wallet.transactions;
        return this.modifyTransactionsResponse(transactions, address);
    }
    /**
     * Gets the transaction hash.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxHash(tx) {
        return tx.hash;
    }
    /**
     * Gets the transaction direction.
     *
     * @param {string} [selfAddress] - Self address.
     * @param {object} tx - The transaction response.
     * @return {boolean} - True for incoming transaction.
     */
    getTxDirection(selfAddress, tx) {
        return tx.direction === INCOMING_TRANSACTION_SIGN;
    }
    /**
     * Gets the transaction recipient address.
     *
     * @param {string} selfAddress - Self address.
     * @param {object} tx - The transaction response.
     * @return {string | null}
     */
    getTxOtherSideAddress(selfAddress, tx) {
        return tx.destinationAddress;
    }
    /**
     * Gets the transaction amount.
     *
     * @param {string} [address]
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxValue(address, tx) {
        return this.wallet.toCurrencyUnit(tx.amount.abs().toString());
    }
    /**
     * Gets the transaction datetime.
     *
     * @param {object} tx - The transaction response.
     * @return {Date}
     */
    getTxDateTime(tx) {
        return new Date(tx.timestamp);
    }
    /**
     * Gets the transaction fee.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxFee(tx) {
        return this.wallet.toCurrencyUnit(tx.fee.toString());
    }
}
export default MyMoneroExplorer;
//# sourceMappingURL=MyMoneroExplorer.js.map