import { Coin } from '../../abstract/index.js';
import NftMixin from '../../coins/nfts/mixins/NftMixin.js';
import { ExternalError, UnknownConfigKeyError } from '../../errors/index.js';
import EtherscanExplorer from '../../explorers/collection/EtherscanExplorer.js';
import Web3Explorer from '../../explorers/collection/Web3Explorer.js';
import Transaction from '../../explorers/Transaction.js';
import { EVMToken } from '../../tokens/index.js';
import { Amount, LazyLoadedLib } from '../../utils/index.js';
import { ConfigKey } from '../../utils/configManager/index.js';
import { EXTERNAL_ERROR } from '../../utils/const/index.js';
import ovmGasPriceOracleAbi from '../abi/ovm-gas-price-oracle-abi.json';
import HasProviders from '../mixins/HasProviders.js';
import HasTokensMixin from '../mixins/HasTokensMixin.js';
import Web3Mixin from '../mixins/Web3Mixin.js';
const DECIMAL = 18;
const DEFAULT_MIN_GAS = 21000;
const UNSPENDABLE_BALANCE = 0;
const MODERATED_GAS_PRICE_TIMEOUT = 10000;
const GWEI = 1e9;
const EMPTY_OVM_GAS_PRICE_ORACLE_CONTRACT = '0x';
// Public key from a compromised mnemonic used for unit tests in other places
const FAKE_EVM_ADDRESS_FOR_FEE_EVALUATION = '0x29625E10Cfe090294DC0eC579E322ce87C822745';
const OVM_GAS_PRICE_ORACLE_CONTRACT_ADDRESS = '0x420000000000000000000000000000000000000F';
const DEFAULT_MAX_GAS = 150000;
const DEFAULT_BLOCK = 'pending';
const HEX_ZERO = '0x0';
const NODE_PROVIDER_OPERATION = 'node';
const BALANCE_PROVIDER_OPERATION = 'balance';
const HISTORY_PROVIDER_OPERATION = 'history';
const TOKEN_PROVIDER_OPERATION = 'token';
const TOKEN_HISTORY_PROVIDER_OPERATION = 'token-history';
const TOKENS_LIST_HISTORY_PROVIDER_OPERATION = 'tokens-list-history';
const SEND_PROVIDER_OPERATION = 'send';
const NFT_SEND_PROVIDER_OPERATION = 'nft-send';
const SOCKET_PROVIDER_OPERATION = 'socket';
const ESTIMATE_GAS_ERROR_MESSAGE_SUBSTRING = 'insufficient funds';
const WEB3_SDK = 'web3Sdk';
const ETHEREUM_JS_WALLET_SDK = 'ethereumJsWalletSdk';
const DEFAULT_MAX_GAS_L1 = 5000;
const DEFAULT_MAX_GAS_PRICE_L1 = 400;
/**
 * @typedef FeeConfigData
 * @type {object}
 * @property {number} defaultGasPrice
 * @property {number} defaultMaxGasPrice
 * @property {number} gasPriceCoefficient
 * @property {number} nftGasPriceCoefficient
 * @property {number} gasLimit
 * @property {number} maxGasLimit
 * @property {number} gasLimitCoefficient
 * @property {number} nftGasLimitCoefficient
 * @property {number} resendTimeout
 * @property {number} unspendableBalance
 */
/**
 * @typedef ExplorerConfig
 * @type {object}
 * @property {string} className
 * @property {string} baseUrl
 * @property {number} chainId
 * @property {number} [txLimit=100]
 * @property {string[]} usedFor
 */
/**
 * @class EVMCoin
 */
class EVMCoin extends Web3Mixin(NftMixin(HasProviders(HasTokensMixin(Coin)))) {
    #privateKey;
    /** @type {string} */
    #gasPriceConfigName;
    /** @type {string} */
    #tokensConfigName;
    /** @type {string} */
    #bannedTokensConfigName;
    /** @type {boolean} */
    #isUseEIP1559;
    /**
     * constructs the object.
     *
     * @param {object} config
     * @param {string} config.id
     * @param {string} config.ticker
     * @param {string} config.name
     * @param {boolean} config.isL2
     * @param {boolean} config.isUseModeratedGasPrice
     * @param {boolean} [config.isUseEIP1559=false] - Use EIP-1559 for send transaction.
     * @param {string} config.alias
     * @param {string[]} [config.features]
     * @param {FeeConfigData} config.feeData
     * @param {ExplorerConfig[]} config.explorers
     * @param {string} config.txWebUrl
     * @param {boolean} config.socket
     * @param {number} config.chainId
     * @param {boolean} [config.notify=false]
     * @param {boolean} [config.isTestnet=false]
     * @param {boolean} [config.isCustom=false]
     */
    constructor(config, db, configManager, logger) {
        const { id, isL2, isUseModeratedGasPrice = false, isUseEIP1559 = false, feeData, explorers } = config;
        super({
            ...config,
            decimal: DECIMAL,
            l2Name: isL2 ? id : null,
            unspendableBalance: feeData.unspendableBalance,
            dependencies: {
                [WEB3_SDK]: new LazyLoadedLib(() => import('web3')),
                [ETHEREUM_JS_WALLET_SDK]: new LazyLoadedLib(() => import('ethereumjs-wallet')),
            },
        }, db, configManager, logger);
        /** @type {import('web3').default|null} */
        this.coreLibrary = null;
        this.setExplorersModules([Web3Explorer, EtherscanExplorer]);
        this.loadExplorers(config);
        this.setFeeData(feeData);
        this.isL2 = isL2;
        /** @type {{ [id: string]: EVMToken }} */
        this.tokens = {};
        /** @type {string[]} */
        this.bannedTokens = [];
        this.nonce = new this.BN('0');
        this.fields.paymentId = false;
        // @TODO Remove this after fix services names in configs
        let gasPriceConfigPrefix;
        let tokenConfigPrefix;
        switch (id) {
            case 'ARB':
                tokenConfigPrefix = 'arbitrum';
                break;
            case 'AVAX':
                gasPriceConfigPrefix = 'avax-c';
                break;
            case 'ETH':
                tokenConfigPrefix = 'ethereum';
                break;
            case 'LUNC':
                tokenConfigPrefix = 'luna-classic';
                break;
            case 'FLR':
                tokenConfigPrefix = 'flare';
                break;
            case 'FTM':
                tokenConfigPrefix = 'fantom';
                break;
            case 'OP':
                tokenConfigPrefix = 'optimism';
                break;
            case 'MATIC':
                gasPriceConfigPrefix = 'polygon';
                tokenConfigPrefix = 'polygon';
                break;
            default:
                gasPriceConfigPrefix = id.toLowerCase();
                tokenConfigPrefix = id.toLowerCase();
        }
        this.#isUseEIP1559 = isUseEIP1559;
        this.#gasPriceConfigName = isUseModeratedGasPrice ? `${gasPriceConfigPrefix}-gas-price` : null;
        this.#tokensConfigName = `${tokenConfigPrefix}-tokens`;
        this.#bannedTokensConfigName = `${tokenConfigPrefix}-tokens-banned`;
        // @TODO implement gas price config fetch by evm nave
        this.web3BaseUrl = explorers.find(({ className }) => className === 'Web3Explorer')?.baseUrl;
        this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
            this.eventEmitter.emit('socket::tx::confirmed', { id: coinId, ticker });
        });
    }
    /**
     * Sets web3 instance to coreLibrary
     * @returns {Promise<void>}
     */
    async initCoreLibrary() {
        if (this.coreLibrary) {
            return;
        }
        const { default: Web3 } = await this.loadLib(WEB3_SDK);
        this.coreLibrary = new Web3(this.web3BaseUrl);
    }
    /**
     * Gets web3 instance
     * @returns {Promise<import('web3').default>}
     */
    async getCoreLibrary() {
        if (!this.coreLibrary) {
            await this.initCoreLibrary();
        }
        return this.coreLibrary;
    }
    get networkType() {
        return 'EVM';
    }
    /**
     * Custom tokens is enabled on EVM by default
     * @return {boolean}
     */
    get isCustomTokenSupported() {
        return true;
    }
    /**
     * Sets fee data
     * @param {FeeConfigData} feeData
     */
    setFeeData(feeData = {}) {
        super.setFeeData(feeData);
        this.defaultGasPrice = Number(feeData.defaultGasPrice) || 1;
        this.defaultMaxGasPrice = Number(feeData.defaultMaxGasPrice) || 100;
        this.gasPriceCoefficient = Number(feeData.gasPriceCoefficient) || 0;
        this.nftGasPriceCoefficient = Number(feeData.nftGasPriceCoefficient);
        this.gasLimit = Number(feeData.gasLimit) || DEFAULT_MIN_GAS;
        this.maxGasLimit = Number(feeData.maxGasLimit) || DEFAULT_MAX_GAS;
        this.gasLimitCoefficient = Number(feeData.gasLimitCoefficient) || 1;
        this.contractGasLimitCoefficient = Number(feeData.contractGasLimitCoefficient) || 5;
        this.nftGasLimitCoefficient = Number(feeData.nftGasLimitCoefficient) || 1;
        this.resendTimeout = feeData.resendTimeout;
        this.unspendableBalance = feeData.unspendableBalance || UNSPENDABLE_BALANCE;
        this.maxGasLimitL1 = Number(feeData.maxGasLimitL1) || DEFAULT_MAX_GAS_L1;
        this.maxGasPriceL1 = Number(feeData.maxGasPriceL1) || DEFAULT_MAX_GAS_PRICE_L1;
    }
    isFeeDynamic() {
        return true;
    }
    /**
     * Gets token transaction list
     *
     * @param {string} contract - Contract address.
     * @returns {Promise<Transaction[]>}
     */
    getTokenTransactions({ contract }) {
        if (!contract) {
            throw new Error(`${this.ticker}: \`contract\` parameter should be defined`);
        }
        return this.getProvider(TOKEN_HISTORY_PROVIDER_OPERATION).getTokenTransactions({
            address: this.address,
            contract,
        });
    }
    /**
     * Gets transaction list
     *
     * @returns {Promise<Transaction[]>}
     */
    async getTransactions() {
        if (!this.address) {
            throw new Error(`${this.id}: getTransactions: address is not loaded`);
        }
        const historyProvider = this.getProvider(HISTORY_PROVIDER_OPERATION);
        const tokensHistoryProvider = this.getProvider(TOKENS_LIST_HISTORY_PROVIDER_OPERATION);
        const [transactions = [], { rawTokenTransactions = [] }] = await Promise.all([
            historyProvider?.getTransactions?.({ address: this.address }) ?? Promise.resolve([]),
            tokensHistoryProvider?.getTokensTransactions?.({
                address: this.address,
            }) ?? Promise.resolve({}),
        ].map((promise) => promise.catch((error) => {
            console.error(error);
            return [];
        })));
        const tokenTransactions = rawTokenTransactions.reduce((txs, rawTx) => {
            const contract = rawTx.contract.toLowerCase();
            const token = this.tokens[contract];
            txs.push(new Transaction({
                ...rawTx,
                amount: !token ? null : rawTx.amount,
            }));
            return txs;
        }, []);
        return transactions.concat(tokenTransactions);
    }
    manageSocket() {
        // @TODO Fix - use id instead of ticker
        this.eventEmitter.on('receive', async ({ address, hash, ticker }) => {
            if (this.ticker === ticker) {
                this.getProvider(SOCKET_PROVIDER_OPERATION).getSocketTransaction({
                    address,
                    hash,
                    tokens: this.tokens,
                    type: 'receive',
                });
            }
        });
        // confirmed transaction message received, balance update needed
        this.eventEmitter.on('confirm', async ({ address, hash, ticker }) => {
            if (this.ticker === ticker) {
                this.getProvider(SOCKET_PROVIDER_OPERATION).getSocketTransaction({
                    address,
                    hash,
                    tokens: this.tokens,
                    type: 'confirm',
                });
            }
        });
    }
    /**
     * List to be excluded from wallets list
     * @return {string[]} array of tickers
     */
    getExcludedTokenList() {
        return ['TRX', 'EOS', 'ICX', 'VEN', 'AION', 'BTT', 'KIN', 'BNB']
            .concat(Array.isArray(this.bannedTokens) ? this.bannedTokens : [])
            .map((token) => token.toLowerCase());
    }
    /**
     * Loads a wallet
     * Mutates the wallet with created privateKey and the address obtained from the private key.
     *
     * @param {Buffer} seed - The mnemonic seed.
     * @param {string} [mnemonicString] - The mnemonic string.
     * @returns {Promise<{id: string, privateKey: string, address: string}>}
     * @throws {Error}
     */
    async loadWallet(seed, mnemonicString) {
        const [coreLibrary, { hdkey }] = await Promise.all([this.getCoreLibrary(), this.loadLib(ETHEREUM_JS_WALLET_SDK)]);
        const ethHDKey = hdkey.fromMasterSeed(seed);
        const wallet = ethHDKey.getWallet();
        const account = await coreLibrary.eth.accounts.privateKeyToAccount(wallet.getPrivateKeyString());
        if (!account) {
            throw new Error(`${this.id} cant get a wallet!`);
        }
        this.#privateKey = account.privateKey;
        this.address = account.address;
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    /**
     * Validates wallet address
     *
     * @param {string} address - The address.
     * @return {Promise<boolean>}
     */
    async validateAddress(address) {
        const coreLibrary = await this.getCoreLibrary();
        return coreLibrary.utils.isAddress(address);
    }
    /**
     * Creates a transaction to transfer funds
     *
     * @param {object} data
     * @param {string} data.address - The destination address.
     * @param {boolean} [data.isSendAll=false] - Send all funds sign.
     * @param {string | null} [data.userFee=null] - User fee precalculated for send all funds.
     * @param {string} data.amount - Amount of funds to send (not used if isSendAll=true).
     * @param {number} [data.nonce] - Nonce.
     * @param {string | null} [data.userGasPrice=null] - Custom gas price.
     * @param {number} [data.multiplier] - Gas price coefficient - Not used here.
     * @param {string} [data.gasLimit] - Custom gas limit.
     * @param {string | null} [data.paymentData=null] - The payment id (only HEX value!).
     * @return {Promise<string>} - Raw signed transaction
     */
    async createTransaction({ address, isSendAll = false, userFee = null, amount, nonce, userGasPrice, multiplier, gasLimit, paymentData = null, }) {
        // Fallbacks only for coin since gasLimit is always set for contracts
        const gas = gasLimit || (await this.estimateGas(amount, address)) || this.gasLimit;
        const gasPrice = userGasPrice || (await this.getGasPrice(true));
        const transaction = {
            gas,
            to: address,
            value: amount,
            nonce: nonce || (await this.getNonce()),
        };
        if (this.#isUseEIP1559) {
            const gasPriceBN = new this.BN(gasPrice);
            const maxPriorityFeePerGas = gasPriceBN.divn(10);
            const maxFeePerGas = gasPriceBN.add(maxPriorityFeePerGas);
            transaction.maxPriorityFeePerGas = maxPriorityFeePerGas.toString();
            transaction.maxFeePerGas = maxFeePerGas.toString();
            transaction.type = '0x2';
        }
        else {
            transaction.gasPrice = gasPrice;
        }
        if (paymentData !== '' && paymentData !== null) {
            transaction.data = paymentData;
        }
        const coreLibrary = await this.getCoreLibrary();
        const signedTx = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);
        return signedTx.rawTransaction;
    }
    #getTransferTokenContractData(contract, to, amount) {
        return this.getProvider(SEND_PROVIDER_OPERATION).createSendTokenContract(contract, this.address, to, amount);
    }
    /**
     * Creates a transaction to transfer funds
     *
     * @param {string} data
     * @param {string} data.address - The destination address.
     * @param {string} data.amount - Amount of funds to send (not used if isSendAll=true).
     * @param {string} data.contract - Contract address.
     * @param {string | null} [data.userGasPrice=null] - Custom gas price.
     * @param {number} [data.multiplier] - Gas price coefficient - Not used here.
     * @param {string} [data.gasLimit] - Custom gas limit.
     * @return {Promise<string>} - Raw signed transaction
     */
    async createTokenTransaction({ address, amount, custom, userGasPrice, gasLimit, contract, multiplier }) {
        const contractData = this.#getTransferTokenContractData(contract, address, amount);
        return this.createTransaction({
            address: contract,
            amount: HEX_ZERO,
            paymentData: contractData,
            userGasPrice,
            gasLimit: gasLimit || (await this.estimateGas(amount, address, contract)),
            multiplier,
        });
    }
    /**
     * Sends transaction
     * @async
     * @param {string} rawtx - Signed raw tx.
     * @returns {Promise<{txid: string}>}
     */
    sendTransaction(rawtx) {
        const tx = this.getProvider(SEND_PROVIDER_OPERATION).sendTransaction(rawtx);
        if (tx) {
            this.nonce = this.nonce.add(new this.BN(1));
        }
        return tx;
    }
    /**
     * Gets gas price from blockchain
     *
     * @param {number} [coefficient = 1] - Custom coefficient for tune gas price.
     * @returns {Promise<number>} - Gas price in WEI
     */
    async getGasPriceForSendNft(coefficient) {
        const rawGasPrice = await this.getGasPrice(true);
        const gasPrice = Number(rawGasPrice) + coefficient * GWEI;
        const defaultMaxGasPriceInGwei = this.defaultMaxGasPrice * GWEI;
        return gasPrice > defaultMaxGasPriceInGwei ? defaultMaxGasPriceInGwei : gasPrice;
    }
    /**
     * Gets gas limit from node
     *
     * @param {string} address - Wallet address.
     * @param {string} toContract - NFT contract address.
     * @param {string} data - Encoded token ABI data.
     * @param {number} [gasLimitCoefficient = 1] - Custom coefficient for tune gas limit.
     * @returns {Promise<number>}
     */
    async estimateGasForSendNft(address, toContract, data, gasLimitCoefficient = 1) {
        const transactionObject = {
            from: address,
            to: toContract,
            value: HEX_ZERO,
            data,
        };
        const coreLibrary = await this.getCoreLibrary();
        const estimatedGas = await coreLibrary.eth.estimateGas(transactionObject).catch((error) => {
            // Error code -32000 means insufficient funds, which is not an error in the initial gas evaluation
            if (!error.message.includes(ESTIMATE_GAS_ERROR_MESSAGE_SUBSTRING)) {
                // @TODO implement logger
            }
            // Fallback value
            return this.maxGasLimit;
        });
        return Math.ceil(estimatedGas * this.nftGasLimitCoefficient);
    }
    /**
     * @typedef UserFeeOptions
     * @type {Object}
     * @property {string} [userGasLimit] - Custom gas limit.
     * @property {string} [userGasPrice] - Custom gas price.
     */
    /**
     * @param {string} toContract - The NFT contract address.
     * @param {string} data - Contract encoded data.
     * @param {UserFeeOptions} userOptions - Custom user options.
     * @returns {Promise<{gasLimit: number, gasPrice: number, nonce: number}>}
     */
    async getNftTransferGasParams(toContract, data, { userGasPrice, userGasLimit }) {
        const { address, nftGasPriceCoefficient, nftGasLimitCoefficient, gasPriceCoefficient: configGasPriceCoefficient, gasLimitCoefficient: configGasLimitCoefficient, defaultGasPrice, gasLimit: coinGasLimit = DEFAULT_MAX_GAS, } = this;
        /** @type number */
        const gasPriceCoefficient = nftGasPriceCoefficient || configGasPriceCoefficient;
        /** @type number */
        const gasLimitCoefficient = nftGasLimitCoefficient || configGasLimitCoefficient;
        const defaultGasValues = [
            (defaultGasPrice + gasPriceCoefficient) * GWEI,
            Math.ceil(coinGasLimit * gasLimitCoefficient),
        ];
        const nonce = (await this.getNonce()).toNumber();
        const [gasPrice, gasLimit] = await Promise.allSettled([
            userGasPrice || this.getGasPriceForSendNft(gasPriceCoefficient),
            userGasLimit || this.estimateGasForSendNft(address, toContract, data, gasLimitCoefficient),
        ]).then((resultList) => resultList.map((result, i) => {
            return result.status === 'fulfilled' ? result.value : defaultGasValues[i];
        }));
        return { gasLimit, gasPrice, nonce };
    }
    /**
     * Gets the fee required to transfer the NFT
     *
     * @param {Object} params
     * @param {string | null} params.contractAddress - NFT contract address.
     * @param {string} params.tokenId - Token id.
     * @param {ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string} params.tokenStandard - Token standard.
     * @param {string|null} [params.toAddress=null] - Recipient address. If it is null or equal to the self wallet
     * address, then the fake address will be used.
     * @param {UserFeeOptions} [params.userOptions={}] - Custom user options.
     * @return {Promise<BN>} - The fee.
     * @throws {ExternalError}
     */
    async getNftFee({ contractAddress, tokenId, tokenStandard, toAddress = null, userOptions = {} }) {
        const targetAddress = !toAddress || toAddress.toLowerCase() === this.address.toLowerCase()
            ? FAKE_EVM_ADDRESS_FOR_FEE_EVALUATION
            : toAddress;
        try {
            const data = await this.getProvider(NFT_SEND_PROVIDER_OPERATION).getNftContractData(this, targetAddress, contractAddress, tokenId, tokenStandard);
            const { gasLimit, gasPrice } = await this.getNftTransferGasParams(contractAddress, data, userOptions);
            return new this.BN(gasPrice).mul(new this.BN(gasLimit));
        }
        catch (error) {
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    /**
     * Creates an NFT transfer transaction.
     *
     * @param {string} [toAddress] - The destination address. Unused here.
     * @param {string} contractAddress - NFT contract address.
     * @param {string} data - Contract encoded data.
     * @param {UserFeeOptions} [userOptions={}] - Custom user options.
     * @return {Promise<string>} - Raw transaction
     * @throws {ExternalError}
     */
    async createNftTransaction({ contractAddress, data, userOptions = {} }) {
        try {
            const { gasLimit, gasPrice, nonce } = await this.getNftTransferGasParams(contractAddress, data, userOptions);
            const transaction = {
                to: contractAddress,
                value: HEX_ZERO,
                gas: gasLimit,
                data,
                nonce,
            };
            if (this.#isUseEIP1559) {
                transaction.maxFeePerGas = gasPrice;
            }
            else {
                transaction.gasPrice = gasPrice;
            }
            const coreLibrary = await this.getCoreLibrary();
            const { rawTransaction } = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);
            return rawTransaction;
        }
        catch (error) {
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    async getNonce() {
        try {
            const coreLibrary = await this.getCoreLibrary();
            this.nonce = new this.BN(await coreLibrary.eth.getTransactionCount(this.address, DEFAULT_BLOCK));
            return this.nonce;
        }
        catch (error) {
            // @TODO implement logger
            return undefined;
        }
    }
    // estimate fee for layer 1 from layer 2
    async getFeeL1({ contract, amount = 1 } = {}) {
        let l1BaseFee;
        if (contract) {
            l1BaseFee = await this.getTokenFeeL1FromOracle(contract, amount);
        }
        else {
            l1BaseFee = await this.getCoinFeeL1FromOracle();
        }
        const weightedGasPrice = new this.BN(16).mul(new this.BN(l1BaseFee)).mul(new this.BN(684)).divn(1000);
        return weightedGasPrice.muln(4);
    }
    // estimate fee for layer 2 from layer 2
    async getFeeL2({ userGasPrice = null, gasLimit = null, contract = null, amount = 1 } = {}) {
        let gasPriceL2BN = new this.BN(userGasPrice || (await this.getGasPrice(true)));
        if (this.#isUseEIP1559) {
            gasPriceL2BN = gasPriceL2BN.add(gasPriceL2BN.divn(10));
        }
        const requiredGas = gasLimit || (contract ? await this.estimateGas(amount, null, contract, this.gasLimit) : this.gasLimit);
        return gasPriceL2BN.mul(new this.BN(requiredGas));
    }
    /**
     * Gets the estimated fee for the transaction
     *
     * @param {object} [options] - options.
     * @param {number} [options.amount=1] - Amount.
     * @param {string} [options.address] - Destination address.
     * @param {string} [options.contract=null] - Contract address.
     * @param {string|number} [options.userGasPrice=null] - Custom gas price.
     * @param {string|number} [options.gasLimit=null] - Custom gas limit.
     * @returns {Promise<BN>}
     */
    async getFee({ userGasPrice = null, gasLimit = null, contract = null, amount = 1 } = {}) {
        let fee = new this.BN(0);
        if (this.isL2) {
            const feeL1 = await this.getFeeL1({ contract, amount });
            const feeL2 = await this.getFeeL2({
                userGasPrice,
                gasLimit,
                contract,
                amount,
            });
            fee = feeL1.add(feeL2);
        }
        else {
            const gasPrice = userGasPrice || (await this.getGasPrice(true));
            const requiredGas = await this.estimateGas(amount, null, contract);
            fee = new this.BN(gasPrice).mul(new this.BN(requiredGas));
        }
        return fee;
    }
    /**
     * @param {string} data
     * @returns {Promise<BN>}
     */
    async _getFeeL1FromOracle(data) {
        const coreLibrary = await this.getCoreLibrary();
        const gasPriceOracleContract = new coreLibrary.eth.Contract(ovmGasPriceOracleAbi, OVM_GAS_PRICE_ORACLE_CONTRACT_ADDRESS);
        const feeL1FromOracle = await gasPriceOracleContract.methods
            .getL1Fee(data)
            .call()
            .catch(async () => {
            const l1GasPriceConfig = await this._getGasPriceL1FromConfig();
            return new this.BN(this.maxGasLimitL1).mul(new this.BN(l1GasPriceConfig)).mul(new this.BN(GWEI));
        });
        return new this.BN(String(feeL1FromOracle));
    }
    /**
     * Gets gas price L1 from ETH network
     * @returns {Promise<number>}
     */
    async _getGasPriceL1FromConfig() {
        const price = await this.configManager?.get(ConfigKey.EthereumGasPrice);
        return (price && price.fast) ?? this.maxGasPriceL1;
    }
    /**
     * @returns {Promise<number>}
     */
    getCoinFeeL1FromOracle() {
        return this._getFeeL1FromOracle(EMPTY_OVM_GAS_PRICE_ORACLE_CONTRACT);
    }
    /**
     * @returns {Promise<number>}
     */
    getTokenFeeL1FromOracle(contract, amount) {
        const contractData = this.#getTransferTokenContractData(contract, FAKE_EVM_ADDRESS_FOR_FEE_EVALUATION, amount);
        return this._getFeeL1FromOracle(contractData);
    }
    /**
     * Gets a sign whether to use moderated gas price
     *
     * @returns {boolean}
     */
    get #isUseModeratedGasPrice() {
        return !!this.#gasPriceConfigName;
    }
    /**
     * Gets gas price in WEI
     *
     * @param {boolean} [withoutCoefficient] - Returns the net gas price if it is set.
     * @returns {Promise<number>}
     */
    async getGasPrice(withoutCoefficient = false) {
        let rawGasPrice;
        if (this.#isUseEIP1559) {
            const coreLibrary = await this.getCoreLibrary();
            const block = await coreLibrary.eth.getBlock('pending');
            rawGasPrice = Number(block.baseFeePerGas);
        }
        else {
            rawGasPrice = this.#isUseModeratedGasPrice
                ? (await this.getModeratedGasPrice().catch())?.standard
                : Number((await this.getProvider(NODE_PROVIDER_OPERATION).getGasPrice().catch())?.node);
        }
        // @TODO Maybe we should increase gasPrice at once by 25% so as not to hit the limit of the 5-minute interval
        //  of change in gasPrice network
        const gasPrice = rawGasPrice || this.defaultGasPrice * GWEI;
        return withoutCoefficient ? gasPrice : gasPrice + this.gasPriceCoefficient * GWEI;
    }
    /**
     * Gets moderate gas prices from EVM Gas station
     *
     * @returns {Promise<{standard: number, fastest: number} | null>}
     */
    async getModeratedGasPrice() {
        // @TODO implement fetch moderated gas config
        return null;
    }
    /**
     * Estimates gas
     * @param {number} amount - Amount.
     * @param {string} [toAddress=MOCKED_ARB_ADDRESS] - Destination address.
     * @param {string} contractAddress - Contract address.
     * @returns {Promise<number>}
     */
    async estimateGas(amount, toAddress, contractAddress) {
        const to = toAddress || FAKE_EVM_ADDRESS_FOR_FEE_EVALUATION;
        const transactionObject = {
            from: this.address,
            to,
            value: amount,
        };
        if (contractAddress) {
            transactionObject.data = this.#getTransferTokenContractData(contractAddress, to, amount);
        }
        const coreLibrary = await this.getCoreLibrary();
        const estimatedGas = await coreLibrary.eth.estimateGas(transactionObject).catch((error) => {
            // Error code -32000 means insufficient funds, which is not an error in the initial gas evaluation
            if (!error.message.includes(ESTIMATE_GAS_ERROR_MESSAGE_SUBSTRING)) {
                // @TODO implement logger
            }
            // Fallback value
            return contractAddress ? this.maxGasLimit : this.gasLimit;
        });
        return Math.round(estimatedGas * (contractAddress ? this.contractGasLimitCoefficient : this.gasLimitCoefficient));
    }
    /**
     * Gets available balance for send in ETH
     *
     * @param {string|number|BN} fee - Custom fee in WEI.
     * @return {Promise<string>}
     */
    async availableBalance(fee) {
        if (!this.balance) {
            return null;
        }
        const maximumFee = (fee && new this.BN(fee)) || (await this.getFee());
        const availableBalance = new this.BN(this.balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));
        if (availableBalance.lt(new this.BN(0))) {
            return '0';
        }
        return this.toCurrencyUnit(availableBalance);
    }
    /**
     * Mutates the wallet with the requested balance and returns it
     *
     * @param {object} tokenInfo
     * @param {boolean} tokenInfo.isToken
     * @param {boolean} tokenInfo.onlyCoin
     * @param {string} tokenInfo.contract
     * @returns {Promise<{balance: string|BN|null}>}
     */
    async getInfo(tokenInfo) {
        // @TODO Refactor using coreLibrary in the Web3Explorer
        // Core library is required in the Web3Explorer, which is obtained there from wallet.instance.
        // We need to make sure that the core Library is present and initialized.
        await this.initCoreLibrary();
        await this.getNonce();
        if (tokenInfo?.isToken) {
            const tokenBalance = await this.getProvider(NODE_PROVIDER_OPERATION).getTokenBalanceByContractAddress({
                address: this.address,
                contractAddress: tokenInfo.contract.toLowerCase(),
            });
            const contractVariant = [tokenInfo.contract, tokenInfo.contract.toLowerCase()];
            contractVariant.forEach((contract) => {
                if (this.tokens[contract]) {
                    this.tokens[contract].balance = tokenBalance.toString();
                }
            });
        }
        const info = await this.getProvider(BALANCE_PROVIDER_OPERATION)
            .getInfo(this.address)
            .catch((error) => console.warn(error));
        if (info?.balance) {
            this.balance = info.balance;
        }
        if (!tokenInfo?.onlyCoin) {
            const tokens = Object.values(this.tokens);
            this.getProvider(NODE_PROVIDER_OPERATION).getTokensInfo(tokens, this.address);
        }
        return { balance: info.balance };
    }
    /**
     * Gets token balance
     *
     * @param {string} contract - Token contract address.
     * @returns {Promise<string|number|BN>}
     */
    getTokenInfo({ contract }) {
        return this.getProvider(NODE_PROVIDER_OPERATION).getTokenBalanceByContractAddress({
            address: this.address,
            contractAddress: contract,
        });
    }
    /**
     * Calculates total balance
     *
     * @returns {Amount}
     */
    calculateTotal() {
        return new Amount(new this.BN(this.balance ?? 0), this);
    }
    /**
     * Creates a token.
     *
     * @param {object} args - The arguments.
     * @return {EVMToken}
     */
    createToken(args) {
        return new EVMToken({
            parent: this,
            ...args,
        }, this.db, this.configManager);
    }
    /**
     * @typedef ExplorerTokenShape
     * @type {object}
     * @property {string} name
     * @property {string} ticker
     * @property {number} decimal
     * @property {string} contract
     * @property {string} parentTicker
     * @property {string} uniqueField
     * @property {string[]} supportedStandards
     *
     */
    /**
     * Returns user token list data
     * @returns {Promise<ExplorerTokenShape[]>}
     */
    async getUserTokenList() {
        const provider = this.getProvider(TOKEN_PROVIDER_OPERATION);
        const userTokens = provider?.getUserTokenList
            ? ((await provider.getUserTokenList(this.address).catch((error) => {
                console.warn(error);
                return [];
            })) || [])
                // @TODO Move check for erc20 to explorers
                .filter((token) => token.supportedStandards?.includes('erc20'))
            : [];
        // Set the balance for found tokens
        userTokens.forEach(({ contract, balance }) => {
            const userToken = this.tokens[contract] ?? this.tokens[contract.toLowerCase()];
            if (userToken) {
                userToken.balance = balance;
            }
        });
        return userTokens;
    }
    /**
     * @typedef ConfigTokenShape
     * @type {object}
     * @property {string} name
     * @property {string} ticker
     * @property {number} decimal
     * @property {string} contract
     * @property {boolean} visibility
     *
     */
    /**
     * Returns all token list data
     *
     * @returns {Promise<ConfigTokenShape[]>}
     */
    async getTokenList() {
        this.bannedTokens = await this.getBannedTokenList();
        const tokens = await this.configManager.get(this.#tokensConfigName);
        return tokens ?? [];
    }
    /**
     * Returns banned token list
     *
     * @async
     * @returns {Promise<string[]>} - Array of contract addresses
     */
    async getBannedTokenList() {
        const banned = await this.configManager?.get(this.#bannedTokensConfigName);
        return banned ?? [];
    }
    /**
     * @typedef TokenObjectShape
     * @type {ConfigTokenShape}
     * @property {'list'|'user'} source
     */
    /**
     * Converts serverToken to internal token format
     *
     * @returns {Promise<TokenObjectShape[]>}
     */
    getTokenObject(serverToken, source = 'user') {
        return source === 'user'
            ? this.getTokenFromUserList(serverToken, source)
            : this.getTokenFromCommonList(serverToken, source);
    }
    /**
     * Maps from user token list to internal token format
     *
     * @param {ConfigTokenShape} token
     * @param {'list'|'user'} source
     * @returns {Promise<TokenObjectShape[]>}
     */
    getTokenFromUserList(token, source) {
        return {
            ...token,
            source,
            visibility: true,
        };
    }
    /**
     * Sets privateKey
     * Mutates the wallet with the private key.
     * Used as a faster method than loadWallet.
     *
     * @param {string} privateKey - The private key.
     * @param {string} [mnemonicString]
     * @returns {void}
     */
    setPrivateKey(privateKey, mnemonicString) {
        this.#privateKey = privateKey;
    }
    /**
     * @TODO Remove after the implementation of the features set in the coin configs
     * Returns a sign NFT is not supported
     *
     * @returns {false}
     */
    isNftSupported() {
        return false;
    }
    get feeTicker() {
        return this.id;
    }
    /**
     * Sign data with pk
     * @param {string} data
     * @return {Sign}
     */
    signData(data) {
        return this.coreLibrary.eth.accounts.sign(data, this.#privateKey);
    }
    /**
     * Sign with provided 3-th party signer callback
     *
     * @param data Data to sign
     * @param signer Callback function
     * @return {*}
     */
    signWithCustomSigner({ data, signer }) {
        return signer({
            ...data,
            privateKey: Buffer.from(this.#privateKey.slice(2), 'hex'),
        });
    }
}
export default EVMCoin;
//# sourceMappingURL=EVMCoin.js.map