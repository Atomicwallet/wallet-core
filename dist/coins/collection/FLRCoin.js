import BN from 'bn.js';
import { Coin } from '../../abstract/index.js';
import { ExternalError } from '../../errors/index.js';
import BlockscoutExplorer from '../../explorers/collection/BlockscoutExplorer.js';
import Web3Explorer from '../../explorers/collection/Web3Explorer.js';
import dropDates from '../../resources/flr/drop-dates.json';
import TOKENS_CACHE from '../../resources/flr/tokens.json';
import { FLRToken } from '../../tokens/index.js';
import FlareClaimContractABI from '../../tokens/ABI/ERC-20/FlareClaimContract.js';
import FTSORewardsABI from '../../tokens/ABI/ERC-20/FlareRewardsManagerContract.js';
import WFLRAbi from '../../tokens/ABI/ERC-20/WFLR.js';
import { Amount, LazyLoadedLib, logger } from '../../utils/index.js';
import { ConfigKey } from '../../utils/configManager/index.js';
import { EXTERNAL_ERROR } from '../../utils/const/index.js';
import BANNED_TOKENS_CACHE from '../../resources/eth/tokens-banned.json';
import { HasProviders, HasTokensMixin, StakingMixin, Web3Mixin } from '../mixins/index.js';
const web3LazyLoaded = new LazyLoadedLib(() => import('web3'));
const hdkeyLazyLoaded = new LazyLoadedLib(() => import('ethereumjs-wallet'));
const NAME = 'Flare';
const TICKER = 'FLR';
const DERIVATION = "m/44'/0'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const CHAIN_ID = 14; // 14 mainnet, 16 coston dev-net
const GWEI = 1000000000;
const MOCK_ETH_ADDR = '0xbdd5468D969e585E38B5a0EEADDb56D5B76814ff';
const DEFAULT_MAX_GAS = '150000';
const DEFAULT_GAS = '21000';
const DEFAULT_AUTOCLAIM_GAS = '55000';
const HEX_ZERO = '0x0';
const WNAT_CONRACT_ADDR = '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d';
const REWARD_MANAGER_ADDR = '0x85627d71921AE25769f5370E482AdA5E1e418d37';
const DEFAULT_RESERVE_FOR_STAKE = '50250000000000000';
/**
 * @class FLRCoin
 */
class FLRCoin extends StakingMixin(Web3Mixin(HasProviders(HasTokensMixin(Coin)))) {
    #privateKey;
    /**
     * constructs the object.
     *
     * @param  { string } alias the alias
     * @param  {{}} feeData the fee data
     * @param  { array }  explorers the explorers
     * @param  { string } txWebUrl the transmit web url
     * @param {*} notify
     * @param { boolean } socket
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
        const config = {
            id,
            alias,
            notify,
            name: NAME,
            ticker: TICKER,
            decimal: DECIMAL,
            unspendableBalance: UNSPENDABLE_BALANCE,
            txWebUrl,
            explorers,
            socket,
            feeData,
        };
        super(config, db, configManager);
        this.derivation = DERIVATION;
        this.setExplorersModules([BlockscoutExplorer, Web3Explorer]);
        this.loadExplorers(config);
        this.setFeeData(feeData);
        this.stakingFeeMultiplier = 2;
        this.gasPriceConfig = null;
        this.bannedTokens = [];
        const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');
        this.web3 = new Web3Explorer({
            wallet: this.instance,
            config: { ...web3Params, webUrl: txWebUrl },
        });
        this.baseUrl = web3Params.baseUrl;
        this.tokens = {};
        this.fields.paymentId = false;
        this.nonce = new this.BN('0');
        this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
            this.eventEmitter.emit('socket::tx::confirmed', { id: coinId, ticker });
        });
    }
    setFeeData(feeData = {}) {
        super.setFeeData(feeData);
        this.gasLimit = feeData.gasLimit || DEFAULT_GAS;
        this.stakingGasLimit = feeData.stakingGasLimit || DEFAULT_MAX_GAS;
        this.gasLimitCoefficient = feeData.gasLimitCoefficient;
        this.gasPriceCoefficient = feeData.gasPriceCoefficient;
        this.defaultGasPrice = new this.BN(feeData.defaultGasPrice * GWEI);
        this.defaultMaxGasPrice = feeData.defaultMaxGasPrice;
        this.autoClaimGasLimit = feeData.autoClaimGasLimit || DEFAULT_AUTOCLAIM_GAS;
        this.reservedForStake = feeData.reservedForStake || DEFAULT_RESERVE_FOR_STAKE;
        this.stakingContract = feeData.stakingContract || WNAT_CONRACT_ADDR;
        this.rewardsContract = feeData.rewardsContract || REWARD_MANAGER_ADDR;
        this.resendTimeout = feeData.resendTimeout;
    }
    isFeeDynamic() {
        return true;
    }
    getTransactions() {
        if (!this.address) {
            throw new Error(`${TICKER}: getTransactions: address is not loaded`);
        }
        return this.getProvider('history').getTransactions({
            address: this.address,
        });
    }
    manageSocket() {
        this.eventEmitter.on('receive', async ({ address, hash, ticker }) => {
            if (this.ticker === ticker) {
                this.getProvider('socket').getSocketTransaction({
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
                this.getProvider('socket').getSocketTransaction({
                    address,
                    hash,
                    tokens: this.tokens,
                    type: 'confirm',
                });
            }
        });
    }
    /**
     * Loads a wallet.
     *
     * @param { buffer } seed
     * @return {Promise<unknown>} The private key.
     */
    async loadWallet(seed) {
        const [{ default: Web3 }, { hdkey }] = await Promise.all([web3LazyLoaded.get(), hdkeyLazyLoaded.get()]);
        this.coreLibrary = new Web3(this.baseUrl);
        const ethHDKey = hdkey.fromMasterSeed(seed);
        const wallet = ethHDKey.getWallet();
        const account = await this.coreLibrary.eth.accounts.privateKeyToAccount(wallet.getPrivateKeyString());
        if (!account) {
            throw new Error(`${TICKER} cant get a wallet!`);
        }
        else {
            this.#privateKey = account.privateKey;
            this.address = account.address;
            this.getNonce();
            return {
                id: this.id,
                privateKey: this.#privateKey,
                address: this.address,
            };
        }
    }
    /**
     * The address getter
     *
     * @return { string } private key hex
     */
    getAddress() {
        try {
            this.#privateKey = this.coreLibrary.eth.accounts.privateKeyToAccount(this.#privateKey).address;
        }
        catch (error) {
            logger.log({ instance: this, error });
        }
        return this.#privateKey;
    }
    /**
     * Validates wallet address
     *
     * @param { string } address The address
     * @return { boolean }
     */
    async validateAddress(address) {
        return this.coreLibrary.utils.isAddress(address);
    }
    /**
     * Creates a transaction.
     *
     * @param { string } address The destination address
     * @param { string } amount The amount to send
     * @param { string } paymentData The payment id (only HEX value!)
     * @param { string | BN } gasLimit
     * @param { number } multiplier coefficient
     * @param  {string | BN } userGasPrice
     * @param { BN } nonce
     * @return {Promise<string>} Raw transaction
     */
    async createTransaction({ address, amount, paymentData = null, nonce, userGasPrice, gasLimit = this.gasLimit, multiplier = this.gasPriceCoefficient, }) {
        let gasPriceIncremented;
        await this.getNonce();
        if (!userGasPrice) {
            const gasPrice = await this.getGasPrice();
            gasPriceIncremented = Number(gasPrice.toString()) * multiplier;
        }
        const transaction = {
            to: address,
            value: amount,
            gas: gasLimit,
            chainId: CHAIN_ID,
            gasPrice: new this.BN(userGasPrice || gasPriceIncremented),
            nonce: nonce || this.nonce.toNumber(),
        };
        if (paymentData !== '' && paymentData !== null) {
            transaction.data = paymentData;
        }
        const signedTx = await this.coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);
        return signedTx.rawTransaction;
    }
    async createTokenTransaction({ address, amount, custom, userGasPrice, gasLimit, contract, multiplier, nonce }) {
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
    /**
     * Send transacrion and increase nonce by 1
     * @param { string } rawtx
     * @returns {Promise<Transaction>}
     */
    async sendTransaction(rawtx) {
        const tx = await this.getProvider('send').sendTransaction(rawtx);
        if (tx) {
            this.nonce = this.nonce.add(new this.BN(1));
        }
        return tx;
    }
    /**
     * Gets max fee per gas from Eth Gas Station
     * For support EIP-1559 standard
     *
     * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas price.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    async getMaxFeePerGas(gasPriceCoefficient) {
        const { standard: standardPrice } = await this.getModerateGasPrice();
        if (!standardPrice) {
            throw new ExternalError({
                type: EXTERNAL_ERROR,
                error: 'Failed to get getMaxFeePerGas',
                instance: this,
            });
        }
        return standardPrice.mul(new BN(gasPriceCoefficient)).toString();
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
            new BN(defaultGasPrice).mul(new BN(gasPriceCoefficient)).toString(),
            Math.ceil(Number(coinGasLimit) * gasLimitCoefficient).toString(),
        ];
        const nonce = (await this.getNonce()).toNumber();
        const [gasPrice, gasLimit] = await Promise.allSettled([
            userGasPrice || this.getMaxFeePerGas(gasPriceCoefficient),
            userGasLimit || this.estimateGasForSendNft(address, toAddress, nonce, data, gasLimitCoefficient),
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
     * @param {string} params.toAddress - Recipient address.
     * @param {UserFeeOptions} [params.userOptions={}] - Custom user options.
     * @return {Promise<BN>} - The fee.
     * @throws {ExternalError}
     */
    async getNftFee({ contractAddress, tokenId, tokenStandard, toAddress, userOptions = {} }) {
        try {
            const data = await this.getProvider('nft-send').getNftContractData(this, toAddress, contractAddress, tokenId, tokenStandard);
            const { gasLimit, gasPrice } = await this.getNftTransferGasParams(toAddress, data, userOptions);
            return new BN(gasPrice).mul(new BN(gasLimit));
        }
        catch (error) {
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
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
                // EIP-1559
                maxFeePerGas: gasPrice,
            };
            const { rawTransaction } = await this.coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);
            return rawTransaction;
        }
        catch (error) {
            console.warn(error);
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    async getNonce() {
        this.nonce = new this.BN(await this.coreLibrary.eth.getTransactionCount(this.address));
        return this.nonce;
    }
    /**
     * Gets the fee.
     *
     *
     * @return {Promise<BN>} The fee.
     * @param {string | number} obj.userGasPrice
     * @param {string | number} obj.gasLimit
     */
    async getFee({ userGasPrice = null, gasLimit = null, multiplier = 1 } = {}) {
        const gasPrice = userGasPrice || (await this.getGasPrice());
        return new BN(String(gasPrice)).mul(new this.BN(gasLimit || this.gasLimit).mul(new this.BN(multiplier)));
    }
    async getGasPrice(withoutCoeff = false) {
        if (withoutCoeff) {
            return this.defaultGasPrice;
        }
        const coeff = new this.BN(this.gasPriceCoefficient);
        const gasInCurrency = new this.BN(Number(this.defaultGasPrice) / GWEI);
        const gasWithCoeff = gasInCurrency.add(coeff);
        return new this.BN(Number(gasWithCoeff) * GWEI);
    }
    async estimateGas(amount, address, contract, defaultGas = DEFAULT_MAX_GAS) {
        const tokenSendData = this.getProvider('send').createSendTokenContract(contract, this.address, MOCK_ETH_ADDR, amount);
        const estimateGas = await this.coreLibrary.eth
            .estimateGas({
            from: this.address,
            nonce: Number(this.nonce.add(new this.BN(1))),
            to: contract,
            data: tokenSendData,
        })
            .catch(() => { });
        return estimateGas ? Math.round(estimateGas * this.gasLimitCoefficient).toString() : defaultGas;
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
        const maximumFee = (fee && new this.BN(fee)) || (await this.getFee());
        const availableBalance = new this.BN(this.balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));
        if (new this.BN(availableBalance).lt(new this.BN(0))) {
            return '0';
        }
        return this.toCurrencyUnit(availableBalance);
    }
    async getInfo(tokenInfo) {
        this.getNonce();
        if (tokenInfo && tokenInfo.isToken) {
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
        const info = await this.getProvider('balance')
            .getInfo(this.address)
            .catch((error) => console.warn(error));
        if (info && info.balance) {
            this.balance = info.balance;
        }
        if (!tokenInfo?.onlyCoin) {
            const tokens = Object.values(this.tokens);
            this.getProvider('node').getTokensInfo(tokens, this.address);
        }
        try {
            await this.getStakingInfo();
        }
        catch (error) {
            logger.log({ instance: this, error });
        }
        return { balance: info.balance, balances: this.balances };
    }
    /**
     * Creates a token.
     *
     * @param {...Array} args The arguments
     * @return {ETHToken}
     */
    createToken(args) {
        return new FLRToken({
            parent: this,
            ...args,
        }, this.db, this.configManager);
    }
    /**
     * Returns user token list data
     * @returns {Promise<Array>}
     */
    async getUserTokenList() {
        const userTokens = (await this.getProvider('token')
            .getUserTokenList(this.address)
            .catch((error) => console.warn(error))) || [];
        userTokens.forEach((token) => {
            const contract = token.contractAddress;
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
     * Returns all token list data
     * @returns {Promise<Array>}
     */
    async getTokenList() {
        this.bannedTokens = await this.getBannedTokenList();
        const tokens = await this.configManager.get(ConfigKey.FlareTokens);
        return tokens ?? TOKENS_CACHE;
    }
    /**
     * Returns banned token list data
     * @returns {Promise<Array>}
     */
    async getBannedTokenList() {
        const banned = await this.configManager.get(ConfigKey.FlareTokensBanned);
        return banned ?? BANNED_TOKENS_CACHE;
    }
    gasPrice() {
        return this.getGasPrice();
    }
    async setPrivateKey(privateKey) {
        const { default: Web3 } = await web3LazyLoaded.get();
        this.coreLibrary = new Web3(this.baseUrl);
        this.#privateKey = privateKey;
    }
    getGasRange(sendType = 'send') {
        return this.feeData[sendType];
    }
    async getEstimatedTimeCfg(force = false) {
        try {
            const isUpdateNeeded = !this.gasPriceConfig || force;
            this.gasPriceConfig = isUpdateNeeded ? await this.web3.getGasPriceConfig() : this.gasPriceConfig;
        }
        catch (error) {
            logger.log({ instance: this, error });
        }
        return this.gasPriceConfig;
    }
    async getEstimatedTimeTx(gasPrice, mapping = false) {
        // ACT-992: This multiplier needed because 'fastest', 'fast', 'average' params in config contains gwei * 10
        const multiplier = 10;
        const config = await this.getEstimatedTimeCfg();
        const speed = ['fastest', 'fast', 'average'].find((key) => config?.[key] <= gasPrice * multiplier);
        if (mapping) {
            const TIMES_MAP = {
                fastest: '<30 sec',
                fast: '<2 min',
                average: '<5 min',
            };
            return TIMES_MAP[speed] || '<30 min';
        }
        return speed;
    }
    /**
     * Transaction for deposit FLR -> WFLR
     *
     * @param {string} obj.amount
     * @return {Promise<string>}
     */
    createDepositTransaction({ amount }) {
        const paymentData = this.createSmartContractCall({
            smartContractAddress: this.stakingContract,
            action: 'stake',
        });
        return this.createTransaction({
            address: this.stakingContract,
            paymentData,
            amount,
            gasLimit: this.stakingGasLimit,
        });
    }
    /**
     * Creates and submit deposit transaction,
     * then creates a delegation tx for completed deposit tx, if no delegates was made previously
     *
     * @param {string} obj.amount
     * @param {string} obj.validator
     * @return {Promise<string>}
     */
    async createStakeTransaction({ amount, validator }) {
        // even 0 delegated votes can be delegated,
        // so existing delegation should be checked by validator appearance
        const alreadyDelegated = Object.keys(this.getValidators()).length > 0;
        const depositTx = await this.createDepositTransaction({ amount });
        if (alreadyDelegated) {
            return depositTx;
        }
        await this.sendTransaction(depositTx);
        await this.getNonce();
        return this.createDelegationTransaction({ validator });
    }
    /**
     * Transaction for withdraw WFLR -> FLR
     *
     * @param {string} obj.amount
     * @return {Promise<string>}
     */
    createUnstakeTransaction({ amount }) {
        const paymentData = this.createSmartContractCall({
            smartContractAddress: this.stakingContract,
            action: 'unstake',
            args: [amount],
        });
        return this.createTransaction({
            address: this.stakingContract,
            paymentData,
            amount: '0',
            gasLimit: this.stakingGasLimit,
        });
    }
    /**
     * Delegate WFLR to chosen validator
     *
     * @param {string> }obj.validator
     * @return {Promise<string>}
     */
    createDelegationTransaction({ validator }) {
        // atomic FTSO for testing purposes
        // 0xbaF20e3912Af66AbC13fb2C14EA77694fC18Fd7a
        const defaultBips = '10000'; // equal to 100%
        const paymentData = this.createSmartContractCall({
            smartContractAddress: this.stakingContract,
            action: 'delegate',
            args: [validator, defaultBips],
        });
        return this.createTransaction({
            address: this.stakingContract,
            paymentData,
            amount: '0',
            gasLimit: this.stakingGasLimit,
        });
    }
    /**
     * Undelegate all WFLR
     *
     * @return {Promise<string>}
     */
    createUndelegationTransaction() {
        const paymentData = this.createSmartContractCall({
            smartContractAddress: this.stakingContract,
            action: 'undelegate',
            args: [],
        });
        return this.createTransaction({
            address: this.stakingContract,
            paymentData,
            amount: '0',
            gasLimit: this.stakingGasLimit,
        });
    }
    /**
     * Claims all unclaimed rewards
     *
     * @param {string} obj.address
     * @return {Promise<string>}
     */
    async createClaimTransaction({ address = this.address } = {}) {
        const { manager: rewardsManagerInterface, address: rewardsManagerAddress } = await this.#getRewardsManagerInterface();
        const epochs = await rewardsManagerInterface.methods.getEpochsWithUnclaimedRewards(address).call();
        const latestEpoch = Math.max(...epochs) || 0;
        const paymentData = rewardsManagerInterface.methods
            .claim(this.address, this.address, latestEpoch, true)
            .encodeABI();
        return this.createTransaction({
            address: rewardsManagerAddress,
            paymentData,
            amount: '0',
            gasLimit: this.stakingGasLimit,
        });
    }
    calculateTotal({ balance, staked, rewards }) {
        return new Amount(balance.toBN().add(staked.toBN()).add(rewards.toBN()), this);
    }
    async calculateAvailableForStake({ balance }) {
        const fees = await this.getFee({ gasLimit: this.stakingGasLimit });
        const reserve = new this.BN(this.reservedForStake);
        const available = balance.toBN().sub(fees).sub(reserve);
        return new Amount(available.isNeg() ? '0' : available, this);
    }
    async createAutoClaimTransaction() {
        const { manager: rewardsManagerInterface } = await this.#getRewardsManagerInterface();
        const claimContractAddress = await rewardsManagerInterface.methods.claimSetupManager().call();
        const executorsList = (await this.configManager.get(ConfigKey.FlareClaimExecutors)) ?? [];
        const executorsAddresses = executorsList.map(({ address }) => address);
        const executorsFees = executorsList
            .reduce((acc, { fee }) => {
            acc = acc.add(new this.BN(this.toMinimalUnit(fee)));
            return acc;
        }, new this.BN('0'))
            .toString();
        const claimManagerInterface = new this.coreLibrary.eth.Contract(FlareClaimContractABI, claimContractAddress);
        const paymentData = claimManagerInterface.methods.setClaimExecutors(executorsAddresses).encodeABI();
        return this.createTransaction({
            address: claimContractAddress,
            paymentData,
            amount: executorsFees,
            gasLimit: this.autoClaimGasLimit,
        });
    }
    async getActiveAutoClaim() {
        const { manager: rewardsManagerInterface } = await this.#getRewardsManagerInterface();
        const claimContractAddress = await rewardsManagerInterface.methods.claimSetupManager().call();
        const claimManagerInterface = new this.coreLibrary.eth.Contract(FlareClaimContractABI, claimContractAddress);
        return claimManagerInterface.methods.claimExecutors(this.address).call();
    }
    async #getRewardsManagerInterface() {
        let rewardsManagerInterface = new this.coreLibrary.eth.Contract(FTSORewardsABI, this.rewardsContract);
        const newContractAddr = await rewardsManagerInterface.methods.newFtsoRewardManager().call();
        const isNewContractAddressAppears = newContractAddr && Number(newContractAddr) > 0;
        if (isNewContractAddressAppears) {
            rewardsManagerInterface = new this.coreLibrary.eth.Contract(FTSORewardsABI, newContractAddr);
        }
        return {
            manager: rewardsManagerInterface,
            address: isNewContractAddressAppears ? newContractAddr : this.rewardsContract,
        };
    }
    /**
     * Fetch delegations percentage for each FTSO provider
     *
     * @param {string} address
     * @return {Promise<{delegatePercentage: any, providers: any}>}
     */
    async fetchDelegations(address = this.address) {
        const contractInterface = new this.coreLibrary.eth.Contract(WFLRAbi, WNAT_CONRACT_ADDR).methods.delegatesOf(address);
        const { _delegateAddresses: providers, _bips: delegatePercentage } = await contractInterface.call();
        return { providers, delegatePercentage };
    }
    /**
     * Return total rewards
     *
     * @param {string} address
     * @returns {Promise<BN>}
     */
    async fetchUnclaimedRewards(address = this.address) {
        /**
         * Create smart-contract interface
         */
        let contractInterface = new this.coreLibrary.eth.Contract(FTSORewardsABI, this.rewardsContract);
        const newContractAddr = await contractInterface.methods.newFtsoRewardManager().call();
        if (newContractAddr && Number(newContractAddr) > 0) {
            contractInterface = new this.coreLibrary.eth.Contract(FTSORewardsABI, newContractAddr);
        }
        /**
         * Fetch all unclaimed epochs for given address
         */
        const rewardsEpochs = await contractInterface.methods.getEpochsWithUnclaimedRewards(address).call();
        /**
         * Fetch rewards amount for each unclaimed epoch
         */
        return Promise.all(rewardsEpochs.map((epoch) => contractInterface.methods.getStateOfRewards(address, epoch).call()));
    }
    /**
     * Calculates delegations from all validators
     *
     * @param {object} validators
     * @return {BN}
     */
    calculateDelegatedVotes(validators) {
        return Object.values(validators).reduce((acc, { delegatedVotes: vote }) => {
            acc = acc.add(vote.toBN());
            return acc;
        }, new this.BN('0'));
    }
    /**
     * Calculates available votes
     *
     * @param {Amount} obj.staked
     * @param {Amount} obj.delegatedVotes
     * @return {BN}
     */
    calculateAvailableVotes({ staked, delegatedVotes }) {
        return staked.toBN().sub(delegatedVotes.toBN());
    }
    /**
     * Calculates cumulative for each rewards in each epochs
     * @param {[object]} unclaimed
     * @return {BN}
     */
    calculateRewards(unclaimed) {
        return unclaimed.reduce((totalRewards, { _rewardAmounts: rewards }) => {
            totalRewards = totalRewards.add(rewards.reduce((rewardsFromEpoch, next) => {
                rewardsFromEpoch = rewardsFromEpoch.add(new this.BN(next));
                return rewardsFromEpoch;
            }, new this.BN('0')));
            return totalRewards;
        }, new this.BN('0'));
    }
    async fetchStakingInfo() {
        const staked = new Amount(this.tokens[WNAT_CONRACT_ADDR.toLowerCase()]?.balance ?? '0', this);
        const { providers = [], delegatePercentage = [] } = await this.fetchDelegations();
        const unclaimedRewards = await this.fetchUnclaimedRewards();
        const validators = providers.reduce((acc, next, index) => {
            acc[next] = {
                delegatedVotes: new Amount(staked
                    .toBN()
                    .div(new this.BN(100))
                    .mul(new this.BN(delegatePercentage[index] / 100)) // delegate percentage in bips, 10000bips = 100%
                    .toString(), this),
            };
            return acc;
        }, {});
        const autoClaimExecutors = await this.getActiveAutoClaim();
        const delegatedVotes = new Amount(this.calculateDelegatedVotes(validators), this);
        const availableVotes = this.calculateAvailableVotes({
            staked,
            delegatedVotes,
        });
        const rewards = new Amount(this.calculateRewards(unclaimedRewards), this);
        const executorsList = (await this.configManager.get(ConfigKey.FlareClaimExecutors)) ?? [];
        const executorsFees = executorsList.reduce((acc, { fee }) => {
            acc = acc.add(new this.BN(this.toMinimalUnit(fee)));
            return acc;
        }, new this.BN('0'));
        return {
            staked,
            validators,
            availableVotes: new Amount(availableVotes.isNeg() ? '0' : availableVotes, this),
            delegatedVotes,
            availableWithdrawals: staked,
            rewards,
            additional: {
                autoClaimExecutors,
                autoClaimFee: executorsFees,
                activeAutoClaim: autoClaimExecutors && autoClaimExecutors.length > 0,
            },
        };
    }
    getNextDropDate() {
        const today = new Date();
        return dropDates.reduce((first, second) => {
            const todayDiff = first - today;
            return todayDiff > 0 && todayDiff < second - today ? first : second;
        });
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
export default FLRCoin;
//# sourceMappingURL=FLRCoin.js.map