import { AptosClient, CoinClient } from 'aptos';
import { ExternalError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import { EXTERNAL_ERROR, GET_TRANSACTIONS_TYPE, HTTP_STATUS_NOT_FOUND } from '../../utils/index.js';
import { convertTimestampToDateTime, getStringWithEnsuredEndChar } from '../../utils/convert.js';
const ACCOUNT_NOT_FOUND_ERROR_CODE = 'account_not_found';
const TX_TIMESTAMPS_IN_ONE_SECOND = 1e6;
/**
 * @typedef GasPriceResponse
 * @property {number} deprioritized_gas_estimate
 * @property {number} gas_estimate
 * @property {number} prioritized_gas_estimate
 */
class AptExplorer extends Explorer {
    constructor({ wallet, config }) {
        super({ wallet, config });
        this.baseUrl = getStringWithEnsuredEndChar(config.baseUrl, '/');
        this.ticker = wallet.ticker;
        this.aptosClient = new AptosClient(this.baseUrl);
        this.coinClient = new CoinClient(this.aptosClient);
    }
    /**
     * Gets allowed tickers
     *
     * @returns {string[]}
     */
    getAllowedTickers() {
        return ['APT'];
    }
    /**
     * Gets an account from the blockchain at its address
     *
     * @async
     * @param {string} address
     * @returns {Promise<AccountData>}
     */
    getAccount(address) {
        return this.aptosClient.getAccount(address);
    }
    /**
     * Send transaction to blockchain
     *
     * @param {Uint8Array} bcsTxn - Signed raw transaction
     * @returns {Promise<{txid: string}>} - The transaction id.
     * @throws {ExternalError}
     */
    async sendTransaction(bcsTxn) {
        try {
            const { hash } = await this.aptosClient.submitSignedBCSTransaction(bcsTxn);
            return { txid: hash };
        }
        catch (error) {
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
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
    async getInfo(address) {
        try {
            const { account } = this.wallet.getLocalAccount();
            const balance = (await this.coinClient.checkBalance(account)).toString();
            return { balance, isRegistered: true };
        }
        catch (error) {
            const { status, errorCode } = error ?? {};
            if (status === HTTP_STATUS_NOT_FOUND && errorCode === ACCOUNT_NOT_FOUND_ERROR_CODE) {
                return {
                    balance: null,
                    isRegistered: false,
                };
            }
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    handleRequestError(error, reqArgs) {
        if (reqArgs.type === GET_TRANSACTIONS_TYPE && error.response?.status === HTTP_STATUS_NOT_FOUND) {
            return [];
        }
        return super.handleRequestError(error, reqArgs);
    }
    /**
     * Gets estimated gas price
     *
     * @async
     * @returns {Promise<{GasPriceResponse}>}
     */
    getGasPrice() {
        return this.aptosClient.estimateGasPrice();
    }
    /**
     * Gets transaction list params
     *
     * @param {number} offset
     * @param {number} [limit]
     * @param {number} [pageNum]
     * @return {start: string, limit: string}
     */
    getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit, pageNum) {
        return { start: String(offset), limit: String(limit) };
    }
    /**
     * Gets transaction url
     *
     * @param {string} address
     * @returns {string}
     */
    getTransactionsUrl(address) {
        return `/accounts/${address}/transactions`;
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
     * Gets the recipient address from the transaction object
     *
     * @param {object} tx - The transaction response.
     * @returns {string}
     */
    #getTxRecipientAddress(tx) {
        return tx.payload?.arguments[0];
    }
    /**
     * Gets the recipient amount from the transaction object
     *
     * @param {object} tx - The transaction response.
     * @returns {string} - The recipient amount in Octas.
     */
    #getTxRecipientAmount(tx) {
        return tx.payload?.arguments[1];
    }
    /**
     * Gets the transaction direction.
     *
     * @param {object} tx - The transaction response.
     * @return {boolean} - True if we accept transaction.
     */
    getTxDirection(selfAddress, tx) {
        return this.#getTxRecipientAddress(tx) === selfAddress;
    }
    /**
     * Gets the transaction recipient address.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxOtherSideAddress(selfAddress, tx) {
        if (this.getTxDirection(selfAddress, tx)) {
            return selfAddress;
        }
        return this.#getTxRecipientAddress(tx);
    }
    /**
     * Gets the transaction amount.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxValue(address, tx) {
        const octas = this.#getTxRecipientAmount(tx);
        return this.wallet.toCurrencyUnit(octas);
    }
    /**
     * Gets the transaction datetime.
     *
     * @param {object} tx - The transaction response.
     * @return {Date}
     */
    getTxDateTime(tx) {
        return convertTimestampToDateTime(Number(tx.timestamp), TX_TIMESTAMPS_IN_ONE_SECOND);
    }
    /**
     * Gets the transaction fee.
     *
     * @param {object} tx - The transaction response.
     * @return {string}
     */
    getTxFee(tx) {
        const { gas_used: gasUsed, gas_unit_price: usedGasPrice } = tx;
        return this.wallet.toCurrencyUnit(BigInt(gasUsed) * BigInt(usedGasPrice));
    }
    /**
     * Gets the transaction confirmations.
     *
     * @param {object} tx - The transaction response.
     * @return {number} The transaction confirmations.
     */
    getTxConfirmations(tx) {
        return tx.success ? 1 : 0;
    }
}
export default AptExplorer;
//# sourceMappingURL=AptExplorer.js.map