/* eslint no-magic-numbers: ["error", { "ignore": [-1, 0, 1, 6, 8, 16, 256] }] */
/* eslint no-bitwise: ["error", { "allow": ["&"] }] */
import { Coin } from '../../abstract/index.js';
import { WalletError } from '../../errors/index.js';
import TrongridExplorer from '../../explorers/collection/TrongridExplorer.js';
import TronscanExplorer from '../../explorers/collection/TronscanExplorer.js';
import TronNodeWithBlockscannerExplorer from '../../explorers/extended/TronNodeWithBlockscannerExplorer.js';
import BANNED_TOKENS_CACHE from '../../resources/trx/tokens-banned.json';
import TOKENS_CACHE from '../../resources/trx/tokens.json';
import { TRXToken } from '../../tokens/index.js';
import { LazyLoadedLib, Amount } from '../../utils/index.js';
import { ConfigKey } from '../../utils/configManager/index.js';
import { SEND_TRANSACTION_TYPE, WALLET_ERROR } from '../../utils/const/index.js';
import { HasProviders, HasTokensMixin, StakingMixin } from '../mixins/index.js';
const hdkeyLib = new LazyLoadedLib(() => import('hdkey'));
const tronwebLib = new LazyLoadedLib(() => import('tronweb'));
const ethersLib = new LazyLoadedLib(() => import('ethers'));
const NAME = 'Tron';
const TICKER = 'TRX';
const DERIVATION = "m/44'/195'/0'";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';
const TRC20_ENERGY = 13500;
const TRC20_ACC_CREATION_FEE = 15000;
const TRC20_BANDWIDTH = 345;
const DEFAULT_ENERGY_PRICE = 0.00028;
const DEFAULT_NET_PRICE = 0.001;
/**
 * Class for bitcoin.
 *
 * @class TRXCoin
 */
class TRXCoin extends StakingMixin(HasProviders(HasTokensMixin(Coin))) {
    #privateKey;
    /**
     * constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object} feeData the fee data
     * @param {Array}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
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
            explorers,
            txWebUrl,
            socket,
            feeData,
        };
        super(config, db, configManager);
        this.derivation = DERIVATION;
        this.setExplorersModules([TronscanExplorer, TrongridExplorer, TronNodeWithBlockscannerExplorer]);
        this.loadExplorers(config);
        this.setFeeData(feeData);
        this.transactions = [];
        this.tokens = {};
        this.bannedTokens = [];
        this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
            this.getInfo();
            if (unconfirmedTx && unconfirmedTx.direction) {
                this.eventEmitter.emit('socket::newtx', {
                    id: coinId,
                    ticker,
                    amount: unconfirmedTx.amount,
                    txid: unconfirmedTx.txid,
                });
            }
            else {
                this.eventEmitter.emit('socket::newtx::outgoing', {
                    id: coinId,
                    ticker,
                });
            }
        });
    }
    setFeeData(feeData = {}) {
        super.setFeeData(feeData);
        this.dynamicTrc20EnergyEnabled = !!feeData.dynamicTrc20EnergyEnabled; // use dynamic energy estimation by default
    }
    async loadTokensList(wallets) {
        const tokenList = await this.getTokenList();
        tokenList.forEach((token) => {
            const newToken = this.createToken({
                name: token.name,
                ticker: token.ticker,
                decimal: token.decimal,
                contract: token.contract,
                uniqueField: token.contract,
                source: 'list',
                visibility: true,
                confirmed: true,
                config: {
                    feeData: {
                        energy: token.energy,
                    },
                },
                notify: Boolean(token.notify),
            });
            wallets.addWallet(newToken);
            this.tokens[token.contract] = newToken;
        });
    }
    async fetchUserTokens() {
        return [];
    }
    /**
     * Creates a token.
     *
     * @return {TRXToken}
     */
    createToken(args) {
        return new TRXToken({
            parent: this,
            ...args,
        }, this.db, this.configManager);
    }
    /**
     * Loads a wallet.
     *
     * @param {Object} seed The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed) {
        return new Promise(async (resolve, reject) => {
            const { default: hdkey } = await hdkeyLib.get();
            const { default: TronWeb } = await tronwebLib.get();
            const hdPrivateKey = hdkey.fromMasterSeed(seed);
            const key = hdPrivateKey.derive(this.derivation);
            const addressBytes = TronWeb.utils.crypto.getAddressFromPriKey(key._privateKey);
            if (!key) {
                reject(new WalletError({
                    type: WALLET_ERROR,
                    error: new Error('private key is empty'),
                    instance: this,
                }));
            }
            this.#privateKey = TronWeb.utils.bytes.byteArray2hexStr(key._privateKey);
            this.address = TronWeb.utils.crypto.getBase58CheckAddress(addressBytes);
            this.tronWeb = new TronWeb({
                fullHost: this.getProvider('node').config.baseUrl,
                privateKey: this.#privateKey,
            });
            resolve({
                id: this.id,
                privateKey: this.#privateKey,
                address: this.address,
            });
        });
    }
    /**
     * The address getter
     *
     * @return {Promise<String>}
     */
    async getAddress() {
        if (this.#privateKey) {
            const { default: TronWeb } = await tronwebLib.get();
            const addressBytes = TronWeb.utils.crypto.getAddressFromPriKey(TronWeb.utils.bytes.hexStr2byteArray(this.#privateKey));
            return TronWeb.utils.crypto.getBase58CheckAddress(addressBytes);
        }
        // TODO refactor
        throw new WalletError({
            type: WALLET_ERROR,
            error: new Error("can't get private key"),
            instance: this,
        });
    }
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @param {String} network The network
     * @return {Boolean}
     */
    async validateAddress(address) {
        try {
            const { default: TronWeb } = await tronwebLib.get();
            return TronWeb.utils.crypto.isAddressValid(address);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @return {Promise<Object>} Raw transaction
     */
    async createTransaction({ address, amount }) {
        return { address, amount };
    }
    async createTokenTransaction(args) {
        return args;
    }
    async sendTransaction({ address, amount, contract = null, userFee = null, transfer = false }) {
        const errors = [];
        if (transfer) {
            return this.sendTokenTransaction({
                address,
                amount,
                contract,
                feeLimit: userFee,
            });
        }
        try {
            const res = await this.tronWeb.trx.send(address, amount, this.#privateKey);
            return {
                txid: res.transaction.txID,
            };
        }
        catch (error) {
            errors.push(error);
        }
        try {
            const builtTx = this.getProvider('send').helper.transactionBuilder.buildTransferTransaction('TRX', this.address, address, amount);
            return this.getProvider('send').sendTransaction(builtTx, this.#privateKey);
        }
        catch (error) {
            errors.push(error);
        }
        throw new WalletError({
            type: SEND_TRANSACTION_TYPE,
            error: new Error(errors),
            instance: this,
        });
    }
    async sendTokenTransaction({ address, amount, contract, feeLimit }) {
        const type = Number(contract) ? 'trc10' : 'trc20';
        if (type === 'trc20') {
            try {
                const contractObject = await this.tronWeb.contract().at(contract);
                const txid = await contractObject.transfer(address, amount).send({ feeLimit }, this.#privateKey);
                return {
                    txid,
                };
            }
            catch (error) {
                throw new WalletError({
                    type: SEND_TRANSACTION_TYPE,
                    error: new Error(error),
                    instance: this,
                });
            }
        }
        const res = await this.tronWeb.trx.sendToken(address, amount, contract, {
            privateKey: this.#privateKey,
        });
        return {
            txid: res.transaction.txID,
        };
    }
    async encodeParameters(inputs) {
        const { utils: ethersUtils } = await ethersLib.get();
        const { AbiCoder } = ethersUtils;
        const ADDRESS_PREFIX_REGEX = /^(41)/;
        if (inputs.length === 0) {
            return '';
        }
        const abiCoder = new AbiCoder();
        const types = [];
        const values = [];
        for (let index = 0; index < inputs.length; index++) {
            let { value } = inputs[index];
            const { type } = inputs[index];
            if (type === 'address') {
                value = value.replace(ADDRESS_PREFIX_REGEX, '0x');
            }
            else if (type === 'address[]') {
                value = value.map((val) => this.tronWeb.address.toHex(val).replace(ADDRESS_PREFIX_REGEX, '0x'));
            }
            types.push(type);
            values.push(value);
        }
        try {
            return abiCoder.encode(types, values).replace(/^(0x)/, '');
        }
        catch (error) {
            console.warn(error);
            return '';
        }
    }
    async sendRawTransaction(signedTransaction) {
        try {
            const result = await await this.tronWeb.trx.sendRawTransaction(signedTransaction);
            return {
                txid: result.transaction.txID,
            };
        }
        catch (error) {
            throw new WalletError({
                type: SEND_TRANSACTION_TYPE,
                error: new Error(error),
                instance: this,
            });
        }
    }
    async estimateDynamicEnergy({ address, amount, contract }) {
        const defaultMaxEnergyUsage = Number(this.feeData.defaultTrc20TransferEnergy || TRC20_ENERGY);
        const defaultEnergy = this.tokens[contract]?.config?.feeData?.energy || defaultMaxEnergyUsage;
        if (!this.dynamicTrc20EnergyEnabled) {
            return defaultEnergy;
        }
        const inputs = [
            {
                type: 'address',
                value: this.tronWeb.address.toHex(address),
            },
            {
                type: 'uint256',
                value: amount,
            },
        ];
        const args = {
            owner_address: this.address,
            contract_address: contract,
            function_selector: 'transfer(address,uint256)',
            parameter: await this.encodeParameters(inputs),
            visible: true,
        };
        const estimatedEnergy = await this.getProvider('dynamicEnergy')
            .getEstimatedEnergy(args)
            .catch(() => {
            // @TODO implement logger
        });
        return estimatedEnergy || defaultEnergy;
    }
    async getFee({ contract, address, amount = '0' }) {
        if (!address) {
            address = this.address;
        }
        try {
            if (this.isTRC20Token(contract)) {
                const historyProvider = this.getProvider('history');
                const acc = await historyProvider.getAccount(this.address).catch(() => ({
                    bandwidth: {
                        energyRemaining: 0,
                        freeNetRemaining: 0,
                    },
                }));
                const { energyRemaining, freeNetRemaining } = acc.bandwidth;
                const isFirstTransferTo = address ? await historyProvider.isFirstTransfer(address).catch(() => true) : false;
                let requiredEnergy = await this.estimateDynamicEnergy({
                    address,
                    contract,
                    amount,
                });
                const energyPrice = Number(this.feeData.oneEnergyInTrx || DEFAULT_ENERGY_PRICE);
                const netPrice = Number(this.feeData.oneBandwidthInTrx || DEFAULT_NET_PRICE);
                if (isFirstTransferTo) {
                    requiredEnergy += TRC20_ACC_CREATION_FEE;
                }
                const estimatedEnergyBurn = requiredEnergy - energyRemaining;
                const estimatedNetBurn = TRC20_BANDWIDTH - freeNetRemaining;
                let burnedForEnergyTrx = 0;
                if (estimatedEnergyBurn > 0) {
                    burnedForEnergyTrx = estimatedEnergyBurn * energyPrice;
                }
                let burnedForNetTrx = 0;
                if (estimatedNetBurn > 0) {
                    burnedForNetTrx = estimatedNetBurn * netPrice;
                }
                return this.toMinimalUnit(burnedForEnergyTrx + burnedForNetTrx);
            }
        }
        catch (error) {
            // @TODO implement logger
            return this.feeData?.feeTRC20;
        }
        return new this.BN(this.feeData.fee);
    }
    getTRC20Fee(tx) {
        const txFee = this.transactions.find((tronTx) => tronTx.txid === tx.transaction_id);
        return txFee?.fee || null;
    }
    async getTransactions() {
        const { transactions = [], transfers = [] } = await this.getProvider('history')
            .getTransactions({ address: this.address })
            .catch((error) => {
            console.error(error);
            return {};
        });
        const { trc20transfers = [] } = await this.getProvider('trc20History')
            .getTransactions({ address: this.address })
            .catch((error) => {
            console.error(error);
            return {};
        });
        const modifiedTransfers = transfers
            .map((tx) => {
            const token = this.tokens[tx.tokenName];
            return (token &&
                this.getProvider('history').modifyTokenTransactionResponse(tx, this.address, token.ticker, token.decimal));
        })
            .filter(Boolean);
        return transactions.concat(modifiedTransfers).concat(trc20transfers);
    }
    async getTransaction(txid) {
        return this.getProvider('tx').getTransaction(this.address, txid);
    }
    isTRC20Token(key) {
        return this.tokens[key]?.contract.indexOf('100') < 0;
    }
    async getInfo() {
        const { balance, assetV2 = [], stakingInfo = {} } = await this.getProvider('balance').getInfo(this.address);
        this.balance = balance;
        assetV2.forEach((asset) => {
            const token = this.tokens[asset.key];
            if (token) {
                this.tokens[asset.key].balance = asset.value;
            }
        });
        this.getProvider('tokens')
            .getInfo(this.address)
            .then(({ assets = [] }) => {
            Object.keys(this.tokens).forEach((key) => {
                const trc20 = this.isTRC20Token(key);
                if (!trc20) {
                    return;
                }
                const assetInfo = assets.find((asset) => asset.tokenId.toLowerCase() === key.toLowerCase());
                this.tokens[key].balance = (assetInfo && assetInfo.balance) || 0;
            });
        })
            .catch((error) => console.warn(`[${this.ticker}] Tronscan Error: failed to fetch trc20 tokens,`, error));
        // additional resources from V2 staking API
        // powerLimit = all votes
        // powerUsed = used votes
        // availableV2 = Limit - Used
        const { tronPowerLimit = 0, tronPowerUsed = 0 } = await this.getProvider('validators').getAccountResource(this.address);
        if (stakingInfo) {
            const validatorsInfo = await this.getProvider('validators').getInfo(this.address);
            const validators = validatorsInfo?.votes?.reduce((acc, { vote_address: address, vote_count: shares }) => {
                acc[address] = {
                    address,
                    staked: new Amount(shares, this),
                };
                return acc;
            }, {}) ?? {};
            const { availableWithdrawals, pendingWithdrawals } = this.calculateFrozenForWithdraw(validatorsInfo?.unfrozenV2);
            const frozenEnergy = new Amount(stakingInfo.frozenBalanceForEnergy.toString(), this);
            const { frozenVotesV1 } = this.calculateFrozenVotesV1(stakingInfo.frozen, frozenEnergy);
            const { frozenVotes } = this.calculateFrozenVotes(tronPowerLimit);
            const staked = this.calculateStakedAmount(stakingInfo.votes);
            const availableVotes = this.calculateAvailableVotes(frozenVotes, tronPowerUsed);
            const rewards = this.calculateRewards(stakingInfo.reward);
            const additional = {
                frozenVotesV1,
            };
            this.setBalances(await this.makeStakingInfoStruct({
                staked,
                availableVotes,
                frozenVotes,
                frozenEnergy,
                rewards,
                pendingWithdrawals,
                availableWithdrawals,
                validators,
                additional,
            }));
        }
        return {
            balance: this.balance,
            balances: this.balances,
        };
    }
    async getStakingInfo() {
        await this.getInfo();
        return this.balances;
    }
    getFrozenV1Votes() {
        const { frozenVotesV1 } = this.getAdditionalInfo();
        return frozenVotesV1;
    }
    calculateStakedAmount(votes) {
        return new Amount(this.toMinimalUnit(votes[0]?.vote_count ?? '0'), this);
    }
    calculateFrozenVotes(frozenTotal) {
        return { frozenVotes: new Amount(this.toMinimalUnit(frozenTotal), this) };
    }
    calculateFrozenVotesV1(frozenVotes, frozenEnergy) {
        const amount = frozenVotes.length > 0 ? new this.BN(frozenVotes[0].frozen_balance).add(frozenEnergy.toBN()).toString() : '0';
        const frozenVotesExpiration = frozenVotes.length > 0 ? frozenVotes[0].expire_time : '0';
        return { frozenVotesV1: new Amount(amount, this), frozenVotesExpiration };
    }
    calculateAvailableVotes(frozenVotes, usedVotes) {
        return new Amount(frozenVotes.toBN().sub(new this.BN(this.toMinimalUnit(usedVotes))), this);
    }
    calculateFrozenForWithdraw(unfrozenVotes = []) {
        const expiration = Math.max(...unfrozenVotes.map(({ unfreeze_expire_time }) => unfreeze_expire_time));
        const totalAmount = unfrozenVotes.reduce((acc, { unfreeze_amount }) => {
            acc = acc.add(new this.BN(unfreeze_amount));
            return acc;
        }, new this.BN('0'));
        return {
            availableWithdrawals: Date.now() >= expiration ? new Amount(totalAmount, this) : new Amount('0', this),
            pendingWithdrawals: Date.now() < expiration ? new Amount(totalAmount, this) : new Amount('0', this),
        };
    }
    calculateAvailableForStake({ balance }) {
        const available = balance
            .toBN()
            .sub(new this.BN(this.feeData.fee))
            .sub(new this.BN(this.feeData.reserveForStake?.toString() ?? '0'));
        return new Amount(available.isNeg() ? '0' : available, this);
    }
    calculateTotal({ balance, frozenVotes, rewards }) {
        return new Amount(balance.toBN().add(frozenVotes.toBN()).add(rewards.toBN()), this);
    }
    calculateRewards(reward) {
        return new Amount(reward?.toString() ?? '0', this);
    }
    async setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
        if (!this.tronWeb) {
            const { default: TronWeb } = await tronwebLib.get();
            this.tronWeb = new TronWeb({
                fullHost: this.getProvider('node').config.baseUrl,
                privateKey,
            });
        }
    }
    async createDelegationTransaction(validator, amount) {
        const votesAvailable = this.getAvailableVotes();
        const isEnoughVotes = votesAvailable.toBN().gte(new this.BN(amount));
        if (!isEnoughVotes) {
            await this.createFreezeTransaction(amount);
            await this.getInfo();
        }
        return this.createVoteTransaction(validator, this.toCurrencyUnit(amount));
    }
    async createFreezeTransaction(amount) {
        const errors = [];
        try {
            const transaction = await this.tronWeb.transactionBuilder.freezeBalanceV2(amount, 'BANDWIDTH', this.address);
            const signedTransaction = await this.tronWeb.trx.sign(transaction, this.#privateKey);
            const result = await this.sendRawTransaction(signedTransaction);
            return result;
        }
        catch (error) {
            errors.push(error);
        }
        throw new WalletError({
            type: SEND_TRANSACTION_TYPE,
            error: new Error(errors),
            instance: this,
        });
    }
    async createVoteTransaction(validator, amount) {
        const errors = [];
        try {
            const transaction = await this.tronWeb.transactionBuilder.vote({
                [validator]: amount,
            }, this.address);
            const signedTransaction = await this.tronWeb.trx.sign(transaction, this.#privateKey);
            return signedTransaction;
        }
        catch (error) {
            errors.push(error);
        }
        throw new WalletError({
            type: SEND_TRANSACTION_TYPE,
            error: new Error(errors),
            instance: this,
        });
    }
    async createUnfreezeTransaction(amount, v1 = false) {
        const errors = [];
        try {
            const transaction = v1
                ? await this.tronWeb.transactionBuilder.unfreezeBalance('BANDWIDTH', this.address)
                : await this.tronWeb.transactionBuilder.unfreezeBalanceV2(amount, 'BANDWIDTH', this.address);
            const signedTransaction = await this.tronWeb.trx.sign(transaction, this.#privateKey);
            const result = await this.tronWeb.trx.sendRawTransaction(signedTransaction);
            return {
                txid: result.transaction.txID,
            };
        }
        catch (error) {
            errors.push(error);
        }
        throw new WalletError({
            type: SEND_TRANSACTION_TYPE,
            error: new Error(errors),
            instance: this,
        });
    }
    async createWithdrawFrozenTransaction() {
        const errors = [];
        try {
            const transaction = await this.tronWeb.transactionBuilder.withdrawExpireUnfreeze(this.address);
            const signedTransaction = await this.tronWeb.trx.sign(transaction, this.#privateKey);
            const result = await this.tronWeb.trx.sendRawTransaction(signedTransaction);
            return {
                txid: result.transaction.txID,
            };
        }
        catch (error) {
            errors.push(error);
        }
        throw new WalletError({
            type: SEND_TRANSACTION_TYPE,
            error: new Error(errors),
            instance: this,
        });
    }
    async createWithdrawRewardTransaction() {
        const unsignedWithdrawRewardsTx = await this.tronWeb.transactionBuilder.withdrawBlockRewards(this.address);
        const signedWithdrawRewardsTx = await this.tronWeb.trx.sign(unsignedWithdrawRewardsTx, this.#privateKey);
        return signedWithdrawRewardsTx;
    }
    /**
     * Returns all token list data
     * @returns {Promise<object[]>}
     */
    async getTokenList() {
        this.bannedTokens = await this.getBannedTokenList();
        const tokens = await this.configManager.get(ConfigKey.TrxTokens);
        return tokens ?? TOKENS_CACHE;
    }
    /**
     * Returns banned token list data
     * @returns {Promise<string[]>}
     */
    async getBannedTokenList() {
        const banned = await this.configManager.get(ConfigKey.TrxTokensBanned);
        return banned ?? BANNED_TOKENS_CACHE;
    }
}
export default TRXCoin;
//# sourceMappingURL=TRXCoin.js.map