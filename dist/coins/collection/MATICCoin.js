import { Coin } from '../../abstract/index.js';
import NftMixin from '../../coins/nfts/mixins/NftMixin.js';
import { ExternalError } from '../../errors/index.js';
import CovalentHQExplorer from '../../explorers/collection/CovalentHQExplorer.js';
import ETHNftExplorer from '../../explorers/collection/ETHNftExplorer.js';
import MoralisExplorer from '../../explorers/collection/MoralisExplorer.js';
import PolyscanExplorer from '../../explorers/collection/PolyscanExplorer.js';
import Web3Explorer from '../../explorers/collection/Web3Explorer.js';
import BlockbookV2WithBlockscannerExplorer from '../../explorers/extended/BlockbookV2WithBlockscannerExplorer.js';
import { MATICToken } from '../../tokens/index.js';
import { LazyLoadedLib, logger } from '../../utils/index.js';
import applyCoefficient from '../../utils/applyCoefficient.js';
import { ConfigKey } from '../../utils/configManager/index.js';
import { EXTERNAL_ERROR } from '../../utils/const/index.js';
import BANNED_TOKENS_CACHE from '../../resources/eth/tokens-banned.json';
import HasProviders from '../mixins/HasProviders.js';
import HasTokensMixin from '../mixins/HasTokensMixin.js';
import Web3Mixin from '../mixins/Web3Mixin.js';
const NAME = 'Polygon';
const TICKER = 'MATIC';
const DERIVATION = "m/44'/0'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const MATIC_CHAIN_ID = 137;
const GWEI = 10 ** 9;
const HEX_ZERO = '0x0';
const DEFAULT_MAX_GAS = '150000';
/**
 * @class MATICCoin
 */
class MATICCoin extends Web3Mixin(NftMixin(HasProviders(HasTokensMixin(Coin)))) {
    #privateKey;
    /**
     * constructs the object.
     *
     * @param  {object} config
     */
    constructor(config, db, configManager) {
        super({
            ...config,
            name: config.name ?? NAME,
            ticker: config.ticker ?? TICKER,
            decimal: DECIMAL,
            unspendableBalance: UNSPENDABLE_BALANCE,
            chainId: config.chainId ?? MATIC_CHAIN_ID,
            dependencies: {
                web3: new LazyLoadedLib(() => import('web3')),
                hdkey: new LazyLoadedLib(() => import('ethereumjs-wallet')),
            },
        }, db, configManager);
        /** @type {object|null} */
        this.coreLibrary = null;
        this.derivation = DERIVATION;
        const { feeData, explorers } = config;
        this.setExplorersModules([
            Web3Explorer,
            BlockbookV2WithBlockscannerExplorer,
            ETHNftExplorer,
            PolyscanExplorer,
            MoralisExplorer,
            CovalentHQExplorer,
        ]);
        this.loadExplorers(config);
        this.setFeeData(feeData);
        this.gasPriceConfig = null;
        this.bannedTokens = [];
        const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');
        this.web3BaseUrl = web3Params.baseUrl;
        this.fields.paymentId = false;
        this.tokens = {};
        this.nonce = new this.BN('0');
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
        const { default: Web3 } = await this.loadLib('web3');
        this.coreLibrary = new Web3(this.web3BaseUrl);
    }
    /**
     * Gets web3 instance
     * @returns {Promise<*>}
     */
    async getCoreLibrary() {
        if (!this.coreLibrary) {
            await this.initCoreLibrary();
        }
        return this.coreLibrary;
    }
    setFeeData(feeData = {}) {
        super.setFeeData(feeData);
        this.gasLimit = String(feeData.gasLimit);
        this.nftGasLimitCoefficient = feeData.nftGasLimitCoefficient;
        this.nftGasPriceCoefficient = feeData.nftGasPriceCoefficient;
        this.gasLimitCoefficient = feeData.gasLimitCoefficient;
        this.gasPriceCoefficient = feeData.gasPriceCoefficient;
        this.defaultGasPrice = new this.BN(feeData.defaultGasPrice * GWEI);
        this.defaultMaxGasPrice = feeData.defaultMaxGasPrice;
        this.resendTimeout = feeData.resendTimeout;
        this.tokenGasLimit = feeData.tokenGasLimit;
    }
    async getTransactions() {
        if (!this.address) {
            throw new Error('MATIC: getTransactions: address is not loaded');
        }
        try {
            const [txs, tokenTxs] = await Promise.allSettled([
                this.getProvider('history').getTransactions({ address: this.address }),
                this.getProvider('history').getTokenTransactions({
                    address: this.address,
                }),
            ]);
            if (txs.status === 'rejected') {
                throw new Error(txs.reason);
            }
            if (tokenTxs.status === 'rejected') {
                throw new Error(tokenTxs.reason);
            }
            return [...txs.value, ...(tokenTxs.value || [])];
        }
        catch (error) {
            logger.log({ instance: this, error });
            return [];
        }
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
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} seed The private key object.
     * @return {Promise<Object>} The private key.
     */
    async loadWallet(seed) {
        const [coreLibrary, { hdkey }] = await Promise.all([this.getCoreLibrary(), this.loadLib('hdkey')]);
        const ethHDKey = hdkey.fromMasterSeed(seed);
        const wallet = ethHDKey.getWallet();
        const account = await coreLibrary.eth.accounts.privateKeyToAccount(wallet.getPrivateKeyString());
        if (!account) {
            throw new Error(`${this.ticker} wallet cannot be loaded`);
        }
        this.#privateKey = account.privateKey;
        this.address = account.address;
        try {
            await this.getNonce();
        }
        catch (error) {
            console.warn(error);
        }
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    async getAddress() {
        if (!this.#privateKey) {
            throw new Error(`${this.ticker} private key is empty`);
        }
        const coreLibrary = await this.getCoreLibrary();
        return coreLibrary.eth.accounts.privateKeyToAccount(this.#privateKey).address;
    }
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {boolean}
     */
    async validateAddress(address) {
        const coreLibrary = await this.getCoreLibrary();
        return coreLibrary.utils.isAddress(address);
    }
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @param {string} paymentData The payment id (only HEX value!)
     * @param {string} gasLimit
     * @param {number} multiplier coefficient
     * @return {Promise<string>} Raw transaction
     */
    async createTransaction({ address, amount, paymentData = null, nonce, userGasPrice, gasLimit, multiplier = this.gasPriceCoefficient, }) {
        const gasPrice = userGasPrice || applyCoefficient(await this.getGasPrice(), multiplier);
        await this.getNonce();
        const transaction = {
            to: address,
            value: amount,
            gas: gasLimit || this.gasLimit,
            chainId: this.chainId,
            gasPrice: new this.BN(gasPrice),
            nonce: nonce || this.nonce,
        };
        this.nonce = this.nonce.add(new this.BN(1));
        if (paymentData) {
            transaction.data = paymentData;
        }
        const coreLibrary = await this.getCoreLibrary();
        const signedTx = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);
        return signedTx.rawTransaction;
    }
    /**
     * Creates an NFT transfer transaction.
     *
     * @param {string} toAddress - The destination address.
     * @param {string} contractAddress - NFT contract address.
     * @param {string} data - Contract encoded data.
     * @param {UserFeeOptions} [userOptions={}] - Custom user options.
     * @return {Promise<string>} - Raw transaction
     * @throws {ExternalError}
     */
    async createNftTransaction({ toAddress, contractAddress, data, userOptions = {} }) {
        try {
            const { gasLimit, gasPrice, nonce } = await this.getNftTransferGasParams(toAddress, data, userOptions);
            const transaction = {
                to: contractAddress,
                value: HEX_ZERO,
                gas: gasLimit,
                data,
                nonce,
                // Old way - non EIP-1559
                gasPrice,
            };
            const coreLibrary = await this.getCoreLibrary();
            const { rawTransaction } = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);
            return rawTransaction;
        }
        catch (error) {
            console.warn(error);
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    createTokens(tokens = [], wallets) {
        return super.createTokens(tokens.filter(({ ticker }) => ticker !== this.ticker), wallets);
    }
    async createTokenTransaction({ address, amount, userGasPrice, gasLimit, contract, multiplier, nonce }) {
        const contractData = this.getProvider('send').createSendTokenContract(contract, this.address, address, amount, nonce);
        return this.createTransaction({
            address: contract,
            amount: '0x0',
            paymentData: contractData,
            userGasPrice,
            gasLimit: gasLimit || (await this.estimateGas(amount, address)),
            multiplier,
            nonce,
        });
    }
    async getNonce() {
        const coreLibrary = await this.getCoreLibrary();
        this.nonce = new this.BN(await coreLibrary.eth.getTransactionCount(this.address));
        return this.nonce;
    }
    async getFee({ userGasPrice = null, gasLimit = null, multiplier = this.gasPriceCoefficient } = {}) {
        const gasPrice = new this.BN(userGasPrice || (await this.getGasPrice(true)));
        return gasPrice.mul(applyCoefficient(gasLimit || this.gasLimit, multiplier));
    }
    /**
     * Gets the fee required to transfer the NFT
     *
     * @param {Object} params
     * @param {string | null} params.contractAddress - NFT contract address.
     * @param {string} params.tokenId - Token id.
     * @param {ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string} params.tokenStandard - Token standard.
     * @param {string} params.toAddress - Recipient address.
     * @param {UserFeeOptions} [params.userOptions={}] - Custom user options.
     * @return {Promise<BN>} - The fee.
     * @throws {ExternalError}
     */
    async getNftFee({ contractAddress, tokenId, tokenStandard, toAddress, userOptions = {} }) {
        try {
            const data = await this.getProvider('nft-send').getNftContractData(this, toAddress, contractAddress, tokenId, tokenStandard);
            const { gasLimit, gasPrice } = await this.getNftTransferGasParams(toAddress, data, userOptions);
            return new this.BN(gasPrice).mul(new this.BN(gasLimit));
        }
        catch (error) {
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    /**
     * @typedef UserFeeOptions
     * @type {Object}
     * @property {string} [userGasLimit] - Custom gas limit.
     * @property {string} [userGasPrice] - Custom gas price.
     */
    /**
     * @param {string} toAddress - The destination address.
     * @param {string} data - Contract encoded data.
     * @param {UserFeeOptions} userOptions - Custom user options.
     * @returns {Promise<{gasLimit: string, gasPrice: string, nonce: number}>}
     */
    async getNftTransferGasParams(toAddress, data, { userGasPrice, userGasLimit }) {
        const { address, nftGasPriceCoefficient, nftGasLimitCoefficient, gasPriceCoefficient: configGasPriceCoefficient, gasLimitCoefficient: configGasLimitCoefficient, defaultGasPrice, gasLimit: coinGasLimit = DEFAULT_MAX_GAS, } = this;
        /** @type number */
        const gasPriceCoefficient = nftGasPriceCoefficient || configGasPriceCoefficient;
        /** @type number */
        const gasLimitCoefficient = nftGasLimitCoefficient || configGasLimitCoefficient;
        const defaultGasValues = [
            new this.BN(defaultGasPrice).mul(new this.BN(gasPriceCoefficient)).toString(),
            Math.ceil(Number(coinGasLimit) * gasLimitCoefficient).toString(),
        ];
        const nonce = (await this.getNonce()).toNumber();
        const [gasPrice, gasLimit] = await Promise.allSettled([
            userGasPrice || this.getNftGasPrice(gasPriceCoefficient),
            userGasLimit || this.estimateGasForSendNft(address, toAddress, nonce, data, gasLimitCoefficient),
        ]).then((resultList) => resultList.map((result, i) => {
            return result.status === 'fulfilled' ? result.value : defaultGasValues[i];
        }));
        return { gasLimit, gasPrice, nonce };
    }
    /**
     * Gets gas limit from node
     *
     * @param {string} address - Wallet address.
     * @param {string} toAddress - Destination wallet address.
     * @param {number} nonce - Nonce.
     * @param {string} data - Encoded token ABI data.
     * @param {number} [gasLimitCoefficient = 1] - Custom coefficient for tune gas limit.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    async estimateGasForSendNft(address, toAddress, nonce, data, gasLimitCoefficient = 1) {
        try {
            /** @type number */
            const fetchedGasLimit = await this.getProvider('nft-send').estimateGas(address, toAddress, nonce, data);
            return Math.ceil(fetchedGasLimit * gasLimitCoefficient).toString();
        }
        catch (error) {
            console.warn(error);
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    /**
     * Gets nft gas price from node
     *
     * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    async getNftGasPrice(gasPriceCoefficient = 1) {
        try {
            const fetchedGasPrice = await this.getProvider('nft-send').getGasPrice();
            return new this.BN(fetchedGasPrice).mul(new this.BN(gasPriceCoefficient)).toString();
        }
        catch (error) {
            console.warn(error);
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    async getGasPrice(withoutCoeff = false) {
        const { fastest = null, safeLow = null } = await this.getModerateGasPrice();
        if (!fastest || !safeLow) {
            return this.defaultGasPrice;
        }
        return new this.BN(withoutCoeff ? safeLow : fastest);
    }
    async getModerateGasPrice() {
        try {
            const moderatedGasPrice = await this.configManager.get(ConfigKey.PolygonGasPrice);
            if (moderatedGasPrice && moderatedGasPrice.fastest && moderatedGasPrice.safeLow) {
                return {
                    fastest: new this.BN(moderatedGasPrice.fastest).mul(new this.BN(GWEI)),
                    safeLow: new this.BN(moderatedGasPrice.safeLow).mul(new this.BN(GWEI)),
                };
            }
            throw new Error(`${this.ticker}: failed to get gas price`);
        }
        catch (error) {
            console.warn(error);
            return {};
        }
    }
    async estimateGas() {
        return new this.BN(this.tokenGasLimit).mul(new this.BN(this.gasLimitCoefficient)).toString();
    }
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    async availableBalance(fee) {
        if (!this.balance) {
            return null;
        }
        const maxFee = (fee && new this.BN(fee)) || (await this.getFee());
        const availableBalance = new this.BN(this.balance)
            .sub(new this.BN(maxFee))
            .sub(new this.BN(this.unspendableBalance));
        if (new this.BN(availableBalance).lt(new this.BN(0))) {
            return '0';
        }
        return this.toCurrencyUnit(availableBalance);
    }
    async getInfo(tokenInfo) {
        // @TODO Refactor using coreLibrary in the Web3Explorer
        // Core library is required in the Web3Explorer, which is obtained there from wallet.instance.
        // We need to make sure that the core Library is present and initialized.
        await this.initCoreLibrary();
        this.getNonce();
        if (tokenInfo?.isToken) {
            const tokenBalance = await this.getProvider('node').getTokenBalanceByContractAddress({
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
        const info = await this.getProvider('balance').getInfo(this.address);
        if (info?.balance) {
            this.balance = info.balance;
        }
        if (!tokenInfo?.onlyCoin) {
            this.getProvider('node').getTokensInfo(Object.values(this.tokens), this.address);
        }
        return { balance: info.balance };
    }
    /**
     * Creates a token.
     *
     * @param {...Array} args The arguments
     * @return {MATICToken}
     */
    createToken(args) {
        return new MATICToken({
            parent: this,
            ...args,
        }, this.db, this.configManager);
    }
    /**
     * Returns user token list data
     * @returns {Promise<Array>}
     */
    async getUserTokenList() {
        const userTokens = (await this.getProvider('tokenlist')
            .getUserTokenList(this.address)
            .catch((error) => console.warn(error))) || [];
        userTokens
            .filter((token) => token.contract_ticker_symbol !== this.ticker)
            .forEach((token) => {
            const contract = token.contract;
            const userToken = this.tokens[contract];
            const userTokenLowerCase = this.tokens[contract.toLowerCase()];
            if (userToken) {
                userToken.balance = token.balance;
            }
            if (userTokenLowerCase) {
                userTokenLowerCase.balance = token.balance;
            }
        });
        return userTokens;
    }
    /**
     * Returns token data based on config name
     * @param {string} configName
     * @returns {Promise<Array>}
     */
    getTokenLists(configName) {
        return this.configManager?.get(configName);
    }
    /**
     * Returns all token data
     * @returns {Promise<Array>}
     */
    async getTokenList() {
        const tokens = await this.getTokenLists(ConfigKey.PolygonTokens);
        return tokens ?? [];
    }
    /**
     * Returns banned token list data
     * @returns {Promise<Array>}
     */
    async getBannedTokenList() {
        const banned = await this.getTokenLists(ConfigKey.PolygonTokensBanned);
        return banned ?? BANNED_TOKENS_CACHE;
    }
    /**
     * Maps from user token list to internal token format
     * @returns {Promise<Object>}
     */
    getTokenFromUserList(token, source) {
        return {
            ...token,
            source,
            visibility: true,
        };
    }
    gasPrice() {
        return this.getGasPrice();
    }
    async setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
    }
    isFeeDynamic() {
        return true;
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
export default MATICCoin;
//# sourceMappingURL=MATICCoin.js.map