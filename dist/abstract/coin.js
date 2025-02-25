import BN from 'bn.js';
import isEqual from 'lodash/isEqual';
import { AbstractWallet } from '../abstract/index.js';
import { CoinFeature } from '../coins/constants.js';
import { ExplorerRequestError, ExternalError, UndeclaredAbstractMethodError } from '../errors/index.js';
import { TxNotifier } from '../utils/index.js';
import { GET_TRANSACTIONS_TYPE, TxEventTypes } from '../utils/const/index.js';
const WALLETS_WITH_CUSTOM_TOKENS = ['ETH'];
const CHECK_TX_UPDATE_TIMEOUT = 3000;
/**
 * Abstract class for wallets.
 *
 * @abstract
 * @class Coin
 */
export default class Coin extends AbstractWallet {
    #id;
    #address;
    #derivation;
    constructor(config, db, configManager) {
        super(config, db, configManager);
        this.dependencies = config.dependencies || {};
        this.config = config;
        this.#id = config.id;
        this.dependencies = config.dependencies ?? {};
        this.explorersModules = {};
        // @TODO refactor
        this.coreLibrary = config.coreLibrary;
        this.coreLib = config.coreLib;
        this.#address = '';
        this.#derivation = '';
        this.socket = config.socket;
        this.unspendableBalance = config.unspendableBalance;
        this.feeData = config.feeData;
        this.txWebUrl = config.txWebUrl;
        this.network = config.network;
        this.chainId = config.chainId;
        this.denom = config.denom;
        this.atomicId = config.atomicId;
        this.BN = BN;
        this.fields = {};
        this.plugins = [];
        this.explorers = [];
        this.transactions = [];
        this.confirmed = true;
        // this.plugins = [new DomainsPlugin()];
        this.txNotifier = new TxNotifier(this);
        this.features = config.features ?? config.coinData?.features ?? [];
        // @TODO handle
        // `TypeError: attempted to set private field on non-instance`
        // on calling:
        // this.setFeeData(config.feeData)
        this.manageSocket();
        this.manageEvents();
    }
    async loadLib(name) {
        try {
            return await this.dependencies[name]?.get();
        }
        catch (error) {
            console.error(`[${this.id}] Error: Could not load "${name}" dependency`, error);
            throw error;
        }
    }
    set id(id) {
        this.#id = id;
    }
    get id() {
        return this.#id;
    }
    set address(address) {
        this.#address = address;
    }
    get address() {
        return this.#address;
    }
    get derivation() {
        return this.#derivation;
    }
    set derivation(derivation) {
        this.#derivation = derivation;
    }
    get deprecatedParent() {
        return this.id;
    }
    get isCustomTokenSupported() {
        return WALLETS_WITH_CUSTOM_TOKENS.includes(this.id) || this.isFeatureSupported(CoinFeature.CustomTokens);
    }
    /**
     * Get fee wallet instance
     */
    get feeWallet() {
        return this;
    }
    /**
     * Don't use it! Use the wallet itself, you don't need `instance`.
     * @private
     * @deprecated
     */
    get instance() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const wallet = this;
        return {
            // getters are used to make this object up-to-date when wallet settings are changed
            get id() {
                return wallet.id;
            },
            get ticker() {
                return wallet.ticker;
            },
            get chainId() {
                return wallet.chainId;
            },
            get name() {
                return wallet.name;
            },
            get alias() {
                return wallet.alias;
            },
            get assetName() {
                return wallet.assetName;
            },
            get decimal() {
                return wallet.decimal;
            },
            get parent() {
                return wallet.id;
            },
            get feeCoefficient() {
                return wallet.coefficient;
            },
            get feeDefault() {
                return wallet.feeData?.fee;
            },
            get reserveForStake() {
                return wallet.feeData?.reserveForStake;
            },
            get gasLimit() {
                return wallet.gasLimit;
            },
            get address() {
                return wallet.address;
            },
            get account() {
                return wallet.address;
            },
            get coreLibrary() {
                return wallet.coreLibrary;
            },
            get coreLib() {
                return wallet.coreLib;
            },
            get denom() {
                return wallet.denom;
            },
            get feeTRC20() {
                return wallet.feeData?.feeTRC20;
            },
            get l2Name() {
                return wallet.l2Name;
            },
            get atomicId() {
                return wallet.atomicId;
            },
            feeDenom: () => this.feeDenom,
            getTickerFromDenom: (value) => this.getTickerFromDenom(value),
            isTestnet: () => this.isTestnet,
            toCurrencyUnit: (value) => this.toCurrencyUnit(value),
            toMinimalUnit: (value) => this.toMinimalUnit(value),
            getClient: () => this.getClient?.(),
            tokens: () => this.tokens,
            getFee: (feeObject) => this.getFee(feeObject),
            getTokens: () => this.tokens,
            getProvider: (usedFor) => this.getProvider(usedFor),
            getTRC20Fee: (feeTRC20Object) => this.getTRC20Fee(feeTRC20Object),
            BN,
        };
    }
    /**
     * The active explorer getter.
     */
    get explorer() {
        return this.explorers[0];
    }
    /**
     * Get private keys object
     */
    get privateKeysObject() {
        return this.KeysObject || false;
    }
    /**
     * Set private keys object
     */
    set privateKeysObject(privateKeysObject) {
        this.KeysObject = privateKeysObject;
    }
    setExplorersModules(explorerModules) {
        explorerModules.forEach((explorer) => {
            this.explorersModules[explorer.name] = explorer;
        });
    }
    /**
     * Define whether the network fee is dynamic
     */
    isFeeDynamic() {
        return false;
    }
    /**
     * Transaction id URL
     */
    getWebTransactionUrl(id) {
        return `${this.txWebUrl}${id}`;
    }
    manageSocket() {
        TxEventTypes.forEach((event) => {
            this.eventEmitter.on(event, async ({ ticker, address, hash, transaction }) => {
                if (this.ticker === ticker) {
                    if (transaction !== undefined) {
                        return this.txNotifier.notify(event, {
                            amount: this.toCurrencyUnit(String(transaction.amount)),
                            direction: this.address.toLowerCase() === transaction.to.toLowerCase(),
                            txid: hash,
                        }, this.id, this.ticker, hash);
                    }
                    let scriptPubKey;
                    if (typeof this.getScriptPubKey === 'function') {
                        try {
                            scriptPubKey = await this.getScriptPubKey();
                        }
                        catch (error) {
                            console.warn(error);
                        }
                    }
                    const explorer = this.getProvider?.('socket') ?? this.explorer;
                    if (typeof explorer?.getSocketTransaction !== 'function') {
                        throw new UndeclaredAbstractMethodError('getSocketTransaction', explorer);
                    }
                    void explorer.getSocketTransaction({
                        address,
                        hash,
                        scriptPubKey,
                        tokens: this.tokens,
                        type: event,
                    });
                }
            });
        });
    }
    manageEvents() {
        this.eventEmitter.on(`update::${this.id}::balance`, (balance) => {
            if (balance) {
                this.balance = balance;
            }
            else {
                this.getInfo();
            }
        });
        this.eventEmitter.on(`update::${this.ticker}::token`, (id) => {
            this.eventEmitter.emit('update::balance', id);
        });
        this.eventEmitter.on(`${this.id}-${this.id}::new-socket-tx`, ({ unconfirmedBalance = undefined, unconfirmedTx = undefined }) => {
            if (unconfirmedBalance) {
                this.balance = unconfirmedBalance;
            }
            if (unconfirmedTx && unconfirmedTx.direction) {
                this.eventEmitter.emit('socket::newtx', {
                    id: this.id,
                    ticker: this.ticker,
                    amount: unconfirmedTx.amount,
                    txid: unconfirmedTx.txid,
                });
            }
            else {
                this.eventEmitter.emit('socket::newtx::outgoing', {
                    id: this.id,
                    ticker: this.ticker,
                });
            }
        });
        this.eventEmitter.on(`${this.id}::new-token-tx`, ({ token, unconfirmedTx }) => {
            const { ticker, id } = token;
            if (unconfirmedTx && unconfirmedTx.direction) {
                this.eventEmitter.emit('socket::newtx', {
                    id,
                    ticker,
                    amount: unconfirmedTx.amount,
                    txid: unconfirmedTx.txid,
                });
            }
            else {
                this.eventEmitter.emit('socket::newtx::outgoing', { id, ticker });
            }
        });
        this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (walletId, tx) => this.onConfirmSocketTx(tx));
    }
    /**
     * Processes a new tx got from the socket (does nothing by default)
     */
    onConfirmSocketTx(tx) { }
    /**
     * Gets the fee.
     *
     * @param {string} amount Amount to transfer in minimal quantum (satoshi, drops and etc)
     * @param {boolean} isSendAll
     *
     * @return {BN} The fee big number
     */
    async getFee(args) {
        return new this.BN(this.fee || 0);
    }
    /**
     * Gets the address.
     */
    getAddress() {
        throw new UndeclaredAbstractMethodError('getAddress', this);
    }
    /**
     * Sets the public key.
     */
    setAddress(address) {
        this.address = address;
    }
    /**
     * Sets the private key.
     */
    async setPrivateKey(privateKey, mnemonic) {
        throw new UndeclaredAbstractMethodError('async setPrivateKey', this);
    }
    /**
     * Validates wallet address
     */
    async validateAddress(address) {
        throw new UndeclaredAbstractMethodError('validateAddress', this);
    }
    /**
     * Gets the wallet.
     */
    async loadWallet(seed, mnemonic) {
        throw new UndeclaredAbstractMethodError('async loadWallet', this);
    }
    async checkTransaction(txInfo) {
        try {
            const tx = await this.explorer?.checkTransaction(this.address, txInfo);
            if (tx) {
                const db = this.getDbTable('transactions');
                db.put(tx);
            }
        }
        catch (error) {
            console.warn(this.ticker, 'Unable to check transaction');
        }
        this.eventEmitter.emit('socket::newtx::outgoing', {
            id: this.id,
            ticker: txInfo.ticker,
        });
        setTimeout(async () => {
            await this.getBalance();
        }, CHECK_TX_UPDATE_TIMEOUT);
    }
    /**
     * Gets the information about a wallet.
     */
    async getInfo() {
        try {
            if (!this.explorer) {
                return { balance: this.balance };
            }
            const { balance = null, nonce = null } = (await this.explorer.getInfo(this.address));
            if (balance) {
                this.balance = balance;
            }
            if (nonce) {
                this.nonce = Number(nonce);
            }
            return { balance: this.balance, nonce: this.nonce || null };
        }
        catch (error) {
            return { balance: this.balance };
        }
    }
    /**
     * Gets the balance.
     */
    async getBalance() {
        const { balance } = await this.getInfo();
        this.balance = balance;
        return balance;
    }
    /**
     * Gets the transactions.
     */
    async getTransactions(args) {
        if (this.explorer) {
            if (!this.address) {
                throw new Error(`[${this.ticker}] getTransactions error: address is not loaded`);
            }
            return await this.explorer
                .getTransactions({
                ...args,
                address: this.address,
            })
                .catch((error) => {
                throw new ExplorerRequestError({
                    type: GET_TRANSACTIONS_TYPE,
                    error,
                    instance: this,
                });
            });
        }
        return this.transactions;
    }
    /**
     * Return available balance for send
     */
    async availableBalance(fees) {
        const balance = (this.balances?.available && this.toMinimalUnit(this.balances?.available)) ?? this.balance;
        if (!balance) {
            return '';
        }
        const maximumFee = (fees && new this.BN(fees)) || new this.BN(await this.getFee());
        const availableBalance = new this.BN(balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));
        if (new this.BN(availableBalance).lt(new this.BN(0))) {
            return '0';
        }
        return this.toCurrencyUnit(availableBalance);
    }
    /**
     * Check amount + fee < balance
     */
    async isAvailableForSend(amount, fee) {
        // @ TODO empty string is always true
        if (Number(amount) < 0) {
            return false;
        }
        // is the balance still undefined then return false
        if (!this.balance) {
            return false;
        }
        const satoshiFee = fee ? this.toMinimalUnit(fee) : undefined;
        const availableBalance = new this.BN(this.toMinimalUnit(await this.availableBalance(satoshiFee)));
        const amountToSpend = new this.BN(this.toMinimalUnit(amount));
        if (amountToSpend.isZero() && availableBalance.isZero()) {
            return false;
        }
        return amountToSpend.lte(availableBalance);
    }
    createExplorer(config) {
        /**
         * @TODO Remove after fixing moralis class name
         */
        const moralisHack = config.className === 'ETHNftMoralisExplorer' ? 'MoralisExplorer' : '';
        const ExplorerModule = this.explorersModules[config.className] ?? this.explorersModules[moralisHack];
        if (!ExplorerModule) {
            throw new ExternalError({
                error: `Could't create explorer instance: class ${config.className} not found`,
                instance: this,
            });
        }
        // @ts-expect-error def
        const explorer = new ExplorerModule({ wallet: this, config });
        this.explorers.push(explorer);
        return explorer;
    }
    processExplorerConfig(config) {
        const explorer = this.explorers.find((item) => isEqual(config, item.config)) ?? this.createExplorer(config);
        if (!explorer) {
            return null;
        }
        explorer.updateParams(config);
        return explorer;
    }
    /**
     * Process config feeData.
     */
    setFeeData(feeData = {}) {
        this.feeData = feeData;
        Object.entries(feeData).forEach(([key, value]) => {
            if (typeof this[key] !== 'undefined' &&
                typeof value !== 'undefined' &&
                key !== '__proto__') {
                this[key] = value;
            }
        });
    }
    updateConfigValue(key, value) {
        this.config[key] = value;
    }
    /**
     * Update dynamic data set
     */
    updateCoinParamsFromServer(data) {
        if (this.config === data) {
            return;
        }
        Object.keys(data).forEach((key) => {
            const value = data[key];
            this.updateConfigValue(key, value);
        });
        this.setFeeData(data.feeData);
        this.loadExplorers(data);
    }
    install() {
        this.plugins.forEach((plugin) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            plugin.install(this);
        });
    }
    /**
     * Process explorers configuration.
     */
    loadExplorers({ explorers, txWebUrl, submitUrl, }) {
        explorers.forEach((exData) => {
            try {
                this.processExplorerConfig({
                    ...exData,
                    submitUrl,
                    webUrl: txWebUrl,
                });
            }
            catch (error) {
                // @TODO implement logger
            }
        });
    }
    /**
     * Gets the unspent transaction outputs.
     */
    async getUnspentOutputs() {
        let scriptPubKey;
        if (typeof this.getScriptPubKey === 'function') {
            scriptPubKey = await this.getScriptPubKey();
        }
        return this.explorer && this.explorer.getUnspentOutputs(this.address, scriptPubKey);
    }
    createTokenTransactionOnce(params) {
        return this.canRun('createTokenTransaction') ? this.createTokenTransaction(params) : {};
    }
    /**
     * Is feature supported by this coin network.
     */
    isFeatureSupported(feature) {
        if (!Object.values(CoinFeature).includes(feature)) {
            throw new Error(`Feature '${feature}' does not exist in the CoinFeature enum`);
        }
        return this.features.includes(feature);
    }
    /**
     * Is NFT supported by this coin network.
     *
     * @deprecated - Use isFeatureSupported method instead.
     */
    isNftSupported() {
        return this.isFeatureSupported(CoinFeature.Nft);
    }
}
//# sourceMappingURL=coin.js.map