import { ExplorerRequestError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import { SEND_TRANSACTION_TYPE, GET_TRANSACTION_TYPE, UNDEFINED_OPERATION_ERROR } from '../../utils/const/index.js';
const RIPPLE_START_DATE = 946684800;
/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
class RippleExplorer extends Explorer {
    constructor(...args) {
        super(...args);
        this.requestId = 0;
    }
    getInitParams() {
        return {
            baseURL: this.config.baseUrl,
            headers: { 'Content-Type': 'text/plain' },
            credentials: false,
        };
    }
    async checkStatusTransaction(txId) {
        const response = await this.request(this.getTransactionUrl(txId), this.getTransactionMethod(), this.getTransactionParams(txId), GET_TRANSACTION_TYPE, this.getTransactionOptions());
        return response.status;
    }
    getAllowedTickers() {
        return ['XRP'];
    }
    getInfoUrl(address) {
        return 'account_info';
    }
    getInfoParams(address) {
        return { account: address };
    }
    modifyInfoResponse(response) {
        return {
            balance: response.account_data.Balance,
            transactions: [],
            sequence: response.account_data.Sequence,
        };
    }
    getTransactionsUrl(address) {
        return 'account_tx';
    }
    getTransactionsParams(address) {
        return { account: address, limit: 999 };
    }
    modifyTransactionsResponse(response, address) {
        this.currentLedgerVersion = response.ledger_index_max;
        return response.transactions.map(({ tx }) => this.modifyTransactionResponse(tx, address));
    }
    getTransactionUrl(txId) {
        return 'tx';
    }
    getTransactionParams(txId) {
        return { transaction: txId, binary: false };
    }
    getTxHash(tx) {
        return tx.hash;
    }
    /**
     * Gets the transaction direction.
     *
     * @param {Object} tx The transaction
     * @return {Boolean} The transaction direction.
     */
    getTxDirection(selfAddress, tx) {
        return tx.Destination === selfAddress;
    }
    /**
     * Gets the transaction recipient.
     *
     * @param {Object} tx The transaction response.
     * @return {(Boolean|String)} The transaction recipient.
     */
    getTxOtherSideAddress(selfAddress, tx) {
        return this.getTxDirection(selfAddress, tx) ? tx.Account : tx.Destination;
    }
    /**
     * Gets the transaction amount.
     *
     * @param {Object} tx The transaction
     * @return {Number} The transaction amount.
     */
    getTxValue(selfAddress, tx) {
        return Number(this.wallet.toCurrencyUnit(tx.Amount));
    }
    getTxDateTime(tx) {
        const timestamp = tx.date + RIPPLE_START_DATE;
        return new Date(Number(`${timestamp}000`));
    }
    getTxMemo(tx) {
        return (tx.DestinationTag && String(tx.DestinationTag)) || '';
    }
    getTxConfirmations(tx) {
        return this.currentLedgerVersion - tx.inLedger;
    }
    /**
     * Sends a transaction.
     *
     * @param {String} rawtx The rawtx
     * @return {Promise<Object>} The transaction data
     */
    async sendTransaction(rawtx) {
        const response = await this.request('submit', null, { tx_blob: rawtx });
        if (!response.engine_result === 'tesSUCCESS') {
            throw new ExplorerRequestError({
                type: SEND_TRANSACTION_TYPE,
                error: new Error(response.engine_result),
                instance: this,
            });
        }
        return { txid: response.tx_json.hash };
    }
    /**
     * Gets trasnaction fee
     *
     * @return {Promise<void>}
     */
    async getFee() {
        const response = await this.request('fee');
        return response.drops.median_fee;
    }
    /**
     * Return last ledger version
     *
     * @return {Promise<number>}
     */
    async getCurrentLedger() {
        const response = await this.request('ledger_current');
        return response.ledger_current_index;
    }
    /**
     *
     * @return {Promise<number>}
     */
    async getServerInfo() {
        const response = await this.request('server_info');
        return response.info;
    }
    /**
     * The request to the explorer
     *
     * @param {String} url Url
     * @param {String} method The method
     * @param {Object} data The data
     * @param {String} type Request type
     * @return {Promise}
     */
    async request(url, method, data = {}, type = UNDEFINED_OPERATION_ERROR) {
        this.requestId += 1;
        const params = {
            jsonrpc: '2.0',
            method: url,
            params: [data],
            id: this.requestId,
        };
        const response = await this.client.post('', JSON.stringify(params)).catch((error) => {
            throw new ExplorerRequestError({
                type,
                error,
                url,
                instance: this,
            });
        });
        // hook for not activated acc
        if (response.data.result.error === 'actNotFound') {
            return {
                account_data: { Balance: 0 },
            };
        }
        if (response.data.result.status === 'error') {
            throw new ExplorerRequestError({
                type,
                url,
                error: new Error(response.data.result.error_message),
                instance: this,
            });
        }
        return response.data.result;
    }
    getTxFee(tx) {
        return this.wallet.toCurrencyUnit((tx && tx.Fee) || 0);
    }
}
export default RippleExplorer;
//# sourceMappingURL=RippleExplorer.js.map