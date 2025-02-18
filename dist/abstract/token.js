import BN from 'bn.js';
import { AbstractWallet } from '../abstract/index.js';
import { getTokenId } from '../utils/index.js';
import { HISTORY_WALLET_UPDATED } from '../utils/eventTopics.js';
const tokensNetworks = new Set(['BNB', 'TRX', 'ETH', 'MATIC', 'BSC', 'LUNA', 'BASE']);
export default class Token extends AbstractWallet {
    #parent;
    #id;
    #contract;
    /**
     * Constructs a new instance of the class.
     */
    constructor(args, db, configManager) {
        super(args, db, configManager);
        this.fields = { paymentId: false };
        this.#parent = args.parent;
        this.#contract = args.contract;
        this.#id = getTokenId({
            contract: this.contract,
            parent: this.#parent.id,
            ticker: this.ticker,
        });
        this.source = args.source;
        this.visibility = args.visibility;
        this.confirmed = args.confirmed;
        this.uniqueField = args.uniqueField;
        this.decimal = args.decimal;
        if (args.config) {
            this.config = args.config;
        }
        // Object.entries(args).forEach(([key, val]) => {
        //   if (key === 'parent') {
        //     this.#parent = val
        //   } else {
        //     this[key] = val
        //   }
        // })
        this.BN = BN;
        this.balance = '';
        this.transactions = [];
        this.isSetBalance = false;
        this.notify = Boolean(args.notify);
        this.manageEvents();
    }
    get id() {
        return this.#id;
    }
    set id(id) {
        this.#id = id;
    }
    get contract() {
        return this.#contract;
    }
    set contract(contract) {
        this.#contract = contract;
    }
    /**
     * Address
     */
    get address() {
        return this.#parent.address;
    }
    /**
     * Token network
     */
    get network() {
        return this.#parent.id;
    }
    get networkType() {
        return this.#parent.networkType;
    }
    /**
     * Get fee wallet instance
     */
    get feeWallet() {
        return this.#parent;
    }
    get feeTicker() {
        return this.#parent.id;
    }
    /**
     * Should be removed
     */
    get deprecatedParent() {
        return this.#parent.id;
    }
    get parentTicker() {
        return this.#parent.id;
    }
    /**
     * Transaction base url
     */
    get txWebUrl() {
        return this.#parent.txWebUrl;
    }
    /**
     * Parent corelib
     */
    get coreLibrary() {
        return this.#parent.coreLibrary;
    }
    /**
     * Determines token custom source
     */
    get isCustom() {
        return this.source === 'custom';
    }
    getWebTransactionUrl(id) {
        return this.#parent.getWebTransactionUrl(id);
    }
    getTxLimit() {
        return this.#parent.getTxLimit();
    }
    /**
     * Gets the wallet.
     */
    async loadWallet(mnemonic) {
        return this;
    }
    /**
     * Validates wallet address
     */
    async validateAddress(address) {
        return this.#parent.validateAddress(address);
    }
    createTransaction(args) {
        return this.#parent.createTokenTransaction({
            ...args,
            contract: this.contract,
        });
    }
    createRawTransactions(args) {
        return this.#parent.createTransaction(args);
    }
    sendTransaction(args) {
        return this.#parent.sendTransaction(args);
    }
    /**
     * Gets the information about a wallet.
     */
    async getInfo() {
        if (this.#parent.getTokenInfo) {
            this.balance = await this.#parent.getTokenInfo({
                contract: this.contract,
            });
        }
        return {
            balance: this.balance,
        };
    }
    /**
     * Gets the available balance.
     */
    async availableBalance() {
        return this.divisibleBalance ? String(this.divisibleBalance) : '0';
    }
    async isAvailableForFee(fee) {
        return this.#parent.indivisibleBalance?.gte(new this.BN(fee));
    }
    /**
     * Gets the fee.
     *
     * @param {String} amount Amount to transfer in satoshis
     * @param {Boolean} isSendAll
     * @param {String} userGasPrice optional custom gas price
     * @param {String} userGasLimit optional custom gas limit
     * @return {Promise<BN>} The fee big number
     */
    getFee(args) {
        return this.#parent.getFee(args);
    }
    getGasPrice(withoutCoefficient, isToken) {
        return this.#parent.getGasPrice(withoutCoefficient, isToken);
    }
    estimateGas(amount, address, contract, defaultGas) {
        return this.#parent.estimateGas(amount, address, contract, defaultGas);
    }
    async getTokenTransactions() {
        try {
            const txs = await this.#parent.getTokenTransactions({ contract: this.contract });
            if (txs.length > 0) {
                const tokenTransactions = txs.filter((tx) => tx.walletId === this.#id);
                const db = this.getDbTable('transactions');
                await db.batchPut(tokenTransactions);
                const { topic, payload } = HISTORY_WALLET_UPDATED(this.id, tokenTransactions);
                this.eventEmitter.emit(topic, payload);
                this.transactions = tokenTransactions;
            }
            return txs;
        }
        catch (error) {
            return this.transactions;
        }
    }
    async getTransactions(offset, limit) {
        try {
            const txs = await this.#parent.getTransactions({
                contract: this.contract,
                offset,
                limit,
            });
            if (txs.length > 0) {
                const tokenTransactions = txs.filter((tx) => tx.walletId === this.#id);
                const db = this.getDbTable('transactions');
                await db.batchPut(tokenTransactions);
                const { topic, payload } = HISTORY_WALLET_UPDATED(this.id, tokenTransactions);
                this.eventEmitter.emit(topic, payload);
                this.transactions = tokenTransactions;
            }
            return txs;
        }
        catch (error) {
            return this.transactions;
            // @TODO should be implemented for all token types
            // by default returns empty array
            // throw new Error(`${this.constructor.name}: method \`getTokenTransactions\`
            // should be defined in ${this.#parent.constructor.name}`)
        }
    }
    checkTransaction(args) {
        return this.#parent.checkTransaction(args);
    }
    async getTransaction(txId) {
        return this.#parent.getTransaction(txId);
    }
    /**
     * Update dynamic data set
     */
    updateTokenParamsFromServer(data) {
        if (!data?.feeData) {
            return;
        }
        Object.entries(data.feeData).forEach(([key, value]) => {
            if (typeof this[key] !== 'undefined' &&
                typeof value !== 'undefined' &&
                key !== '__proto__') {
                this[key] = value;
            }
        });
    }
    isTagShown() {
        return tokensNetworks.has(this.#parent.id);
    }
    manageEvents() {
        this.eventEmitter.on(`${this.#parent.id}-${this.id}::new-socket-tx`, ({ unconfirmedTx }) => {
            this.eventEmitter.emit(`${this.#parent.id}::new-token-tx`, {
                token: this,
                unconfirmedTx,
            });
        });
    }
    /**
     * isActivated getter
     * Allows to determine if a token is activated.
     */
    get isActivated() {
        return this.#parent.isActivated;
    }
    /**
     * Activates token
     * Also activates the parent coin and all associated tokens.
     */
    async activate() {
        return this.#parent.activate();
    }
    /**
     * Deactivates token
     * Also deactivates the parent coin and all associated tokens.
     */
    deactivate() {
        return this.#parent.deactivate();
    }
    removeTokenFromDb(args) {
        return this.#parent.removeTokenFromDb(args);
    }
}
//# sourceMappingURL=token.js.map