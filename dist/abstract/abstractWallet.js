import BN from 'bn.js';
import { Emitter, defaultConfigManager } from '../utils/index.js';
import { WALLETS } from '../utils/index.js';
import { toMinimal, toCurrency } from '../utils/convert.js';
import { BaseDatabase } from '../utils/db/index.js';
const SEND_TIMEOUT = 5000;
const delayed = {};
/**
 * Base class for any asset presented to the user.
 */
export default class AbstractWallet {
    #name;
    #ticker;
    #decimal;
    constructor({ name, ticker, decimal, memoRegexp }, db, configManager) {
        this.indivisibleBalance = null;
        this.divisibleBalance = null;
        this.#name = name;
        this.#ticker = ticker;
        this.#decimal = decimal;
        this.configManager = configManager ?? defaultConfigManager;
        this.db = db ?? new BaseDatabase();
        this.alias = 'atomic';
        this.memoRegexp = memoRegexp;
    }
    set ticker(ticker) {
        this.#ticker = ticker;
    }
    get ticker() {
        return this.#ticker;
    }
    set decimal(decimal) {
        this.#decimal = decimal;
    }
    get decimal() {
        return this.#decimal;
    }
    set name(name) {
        this.#name = name;
    }
    get name() {
        return this.#name;
    }
    get networkType() {
        return '';
    }
    get explorer() {
        return undefined;
    }
    get eventEmitter() {
        return Emitter;
    }
    getDbTable(tableName) {
        return this.db.table(tableName);
    }
    isStakingSupported() {
        return false;
    }
    toMinimalUnit(value, decimal) {
        return toMinimal(value || '0', decimal || this.decimal);
    }
    toCurrencyUnit(value, decimal) {
        return toCurrency(value, decimal || this.decimal);
    }
    /**
     * Gets the actual balance
     *
     * @return {String} Balance in satoshis
     */
    get balance() {
        return this.indivisibleBalance ? this.indivisibleBalance.toString() : null;
    }
    /**
     * Sets currency value from satoshi when balance set.
     *
     * @param {String|BN} value The value
     */
    set balance(value) {
        const isValidValue = value !== null && value !== '' && value !== undefined;
        const oldBalance = this.divisibleBalance;
        if (isValidValue) {
            this.indivisibleBalance = new BN(String(value));
            this.divisibleBalance = this.toCurrencyUnit(value);
        }
        if (this.eventEmitter) {
            this.eventEmitter.emit(`update::${this.deprecatedParent}::token`, this.id);
        }
        if (this.eventEmitter && this.divisibleBalance !== oldBalance && !!oldBalance) {
            this.eventEmitter.emit(WALLETS.BALANCE_UPDATED, { wallet: this });
        }
    }
    /**
     * Get fee ticker
     *
     * @return {String} The fee ticker
     */
    get feeTicker() {
        return this.ticker;
    }
    getFeeSettings() {
        return {};
    }
    /*
     * Wrappers for createTransaction, createTokenTransaction with double-send prevent check
     *
     */
    canRun(funcName) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if ((delayed[funcName] ?? 0) + SEND_TIMEOUT <= Date.now()) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            delayed[funcName] = Date.now();
            return true;
        }
        return false;
    }
    async sendTransaction(rawtx) {
        return this.explorer && this.explorer.sendTransaction(rawtx);
    }
    createTransactionOnce(params) {
        return this.canRun('createTransaction') ? this.createTransaction(params) : {};
    }
    sendTransactionOnce(params) {
        return this.canRun('sendTransaction') ? this.sendTransaction(params) : {};
    }
    sendRawTransactionOnce(params) {
        return this.canRun('sendRawTransaction') ? this.sendRawTransaction(params) : {};
    }
    /**
     * Gets the transaction info.
     *
     * @param {String} txId The transaction identifier.
     * @return {Promise<Object>} The transaction.
     */
    async getTransaction(txId) {
        return this.explorer && this.explorer.getTransaction(this.address, txId);
    }
    /**
     * Determines if the amount is available for send.
     */
    async isAvailableForSend(amount, fee) {
        const availableBalance = await this.availableBalance();
        return new BN(this.toMinimalUnit(amount)).lte(new BN(this.toMinimalUnit(availableBalance)));
    }
    /**
     * Returns a ticker that a user should see in the connection.
     */
    getUserTicker() {
        return this.ticker;
    }
    validateMemo(memo) {
        if (this.memoRegexp) {
            return new RegExp(this.memoRegexp).test(memo);
        }
        return false;
    }
    getTxLimit() {
        return this.explorer && this.explorer.getTxLimit();
    }
    get canPaginate() {
        return this.explorer && this.explorer.canPaginate;
    }
    /**
     * Returns stub is NFT supported sign
     */
    isNftSupported() {
        return false;
    }
    /**
     * Comparing instance values with given ones
     */
    isMatch({ ticker, contract, parent, address, network, chainId }) {
        const optional = {
            contract,
            parent,
            address,
            network,
            chainId,
        };
        if (!ticker) {
            throw new Error('Parameter `ticker` or `id` is required');
        }
        const requiredEq = this.ticker.toLowerCase() === ticker.toLowerCase();
        return Object.keys(optional).reduce((result, key) => {
            if (key in this) {
                const thisValue = this[key];
                const optionalValue = optional[key];
                if (thisValue && typeof thisValue !== 'object' && typeof optionalValue !== 'object') {
                    return result && thisValue.toString().toLowerCase() === optionalValue.toString().toLowerCase();
                }
            }
            return result;
        }, requiredEq);
    }
}
//# sourceMappingURL=abstractWallet.js.map