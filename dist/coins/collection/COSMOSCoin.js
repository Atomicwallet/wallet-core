import { stringToPath } from '@cosmjs/crypto';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import bech32 from 'bech32';
import * as BitcoinJS from 'bitcoinjs-lib';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Coin } from '../../abstract/index.js';
import { ExplorerRequestError, WalletError } from '../../errors/index.js';
import CosmosNodeExplorerV2 from '../../explorers/collection/CosmosNodeExplorerV2.js';
import { Amount } from '../../utils/index.js';
import { ATOM_MSG_TYPES, GET_TRANSACTIONS_TYPE, WALLET_ERROR } from '../../utils/index.js';
import wif from 'wif';
import { CosmosTxTypes } from '../libs/index.js';
import { HasBlockScanner, HasProviders, StakingMixin } from '../mixins/index.js';
class COSMOSCoin extends StakingMixin(HasBlockScanner(HasProviders(Coin))) {
    #privateKey;
    /**
     * @typedef FeeConfigData
     * @type {object}
     * @property {number} fee
     * @property {number} sendFeeGas
     * @property {number} stakingFeeGas
     * @property {number} reserveForStake
     * @property {number} reStakingFeeGas
     * @property {number} claimFeeGas
     * @property {number} minClaimSum
     * @property {number} unspendableBalance
     */
    /**
     * constructs the object.
     *
     * @param {object} config
     * @param {string} config.id
     * @param {string} config.ticker
     * @param {string} config.name
     * @param {string} config.prefix - address bech32 prefix
     * @param {string} config.denom
     * @param {number} config.decimal
     * @param {string} config.alias
     * @param {string[]} [config.features]
     * @param {FeeConfigData} config.feeData
     * @param {ExplorerConfig[]} config.explorers
     * @param {string} config.txWebUrl
     * @param {boolean} config.socket
     * @param {boolean} [config.notify=false]
     */
    constructor(config, db, configManager) {
        const { prefix, denom, feeData, derivation } = config;
        super({
            ...config,
            unspendableBalance: feeData.unspendableBalance,
        }, db, configManager);
        this.derivation = derivation;
        this.prefix = prefix;
        this.denom = denom;
        this.fee = feeData.fee;
        this.sendFeeGas = feeData.sendFeeGas;
        this.stakingFeeGas = feeData.stakingFeeGas;
        this.reserveForStake = feeData.reserveForStake;
        this.reStakingFeeGas = feeData.reStakingFeeGas;
        this.claimFeeGas = feeData.claimFeeGas;
        this.minClaimSum = feeData.minClaimSum;
        this.transactions = [];
        this.fields.paymentId = true;
        this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (_, unconfirmedTx) => {
            this.onConfirmSocketTx(unconfirmedTx);
        });
        this.setExplorersModules([CosmosNodeExplorerV2]);
        this.loadExplorers(config);
    }
    async loadWallet(seed, mnemonic) {
        const hdPrivateKey = BitcoinJS.bip32.fromSeed(seed);
        const key = hdPrivateKey.derivePath(this.derivation);
        if (!key) {
            throw new WalletError({
                type: WALLET_ERROR,
                error: new Error("can't get a privateKey!"),
                instance: this,
            });
        }
        const publicKeyHash = BitcoinJS.crypto.hash160(key.publicKey);
        this.#privateKey = key.toWIF();
        this.address = bech32.encode(this.prefix, bech32.toWords(publicKeyHash));
        this.setPrivateKey(key.toWIF(), mnemonic);
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress() {
        if (this.#privateKey) {
            const keyPair = BitcoinJS.ECPair.fromWIF(this.#privateKey);
            const publicKeyHash = BitcoinJS.crypto.hash160(keyPair.publicKey);
            return bech32.encode(this.prefix, bech32.toWords(publicKeyHash));
        }
        return new WalletError({
            type: WALLET_ERROR,
            error: new Error('privateKey is empty!'),
            instance: this,
        });
    }
    getSignKeys() {
        const keyPair = BitcoinJS.ECPair.fromWIF(this.#privateKey);
        const privateKeyBuffer = wif.decode(this.#privateKey);
        return {
            privateKey: privateKeyBuffer.privateKey.toString('hex'),
            publicKey: keyPair.publicKey.toString('hex'),
        };
    }
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
        try {
            const { prefix } = bech32.decode(address);
            return prefix === this.prefix;
        }
        catch (error) {
            // throw new Error(`Fail to validate ${this.ticker} address [${address}]`)
            return false;
        }
    }
    async getTransaction(txId) {
        return this.getProvider('history2').getTransaction(this.address, txId);
    }
    async getTransactions({ address = this.address, offset = 0, limit = this.explorer.defaultTxLimit, pageNum = 0 }) {
        this.transactions = await this.getProvider('history2')
            .getTransactions({ address, offset, limit, pageNum, denom: this.denom })
            .catch((error) => {
            throw new ExplorerRequestError({
                type: GET_TRANSACTIONS_TYPE,
                error,
                instance: this,
            });
        });
        return this.transactions;
    }
    async getTransactionBlueprint({ type, ...params }) {
        if (CosmosTxTypes[type]) {
            return CosmosTxTypes[type](params);
        }
        if (type === ATOM_MSG_TYPES.Withdraw) {
            return this.getProvider('send2').getTransactionRewardsBlueprint({
                from: this.address,
                ...params,
            });
        }
        throw new Error(`[${this.ticker}] no ${type} tx blueprint found`);
    }
    async sign(messages, fee, memo = '') {
        this.signer = this.signer || (await SigningStargateClient.offline(this.wallet));
        const signerData = await this.getProvider('send2').getSignerData(this.address);
        return this.signer.signDirect(this.address, messages, fee, memo, signerData);
    }
    createTransaction({ address, amount, memo = '' }) {
        const messages = [
            {
                typeUrl: '/cosmos.bank.v1beta1.MsgSend',
                value: {
                    fromAddress: this.address,
                    toAddress: address,
                    amount: [{ denom: this.denom, amount }],
                },
            },
        ];
        const fee = {
            amount: [{ denom: this.denom, amount: this.fee }],
            gas: this.sendFeeGas,
        };
        return this.sign(messages, fee, memo);
    }
    async sendTransaction(txRaw) {
        const txBytes = TxRaw.encode(txRaw).finish();
        return this.getProvider('send2').sendTransaction(txBytes);
    }
    createDelegationTransaction(validator, amount, memo = '') {
        const messages = [
            {
                typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
                value: {
                    delegatorAddress: this.address,
                    validatorAddress: validator,
                    amount: { denom: this.denom, amount },
                },
            },
        ];
        const fee = {
            amount: [{ denom: this.denom, amount: this.fee }],
            gas: this.stakingFeeGas,
        };
        return this.sign(messages, fee, memo);
    }
    createRedelegationTransaction(fromValidator, validator, amount, memo = '') {
        const messages = [
            {
                typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
                value: {
                    delegatorAddress: this.address,
                    validatorSrcAddress: fromValidator,
                    validatorDstAddress: validator,
                    amount: { denom: this.denom, amount },
                },
            },
        ];
        const fee = {
            amount: [{ denom: this.denom, amount: this.fee }],
            gas: this.reStakingFeeGas,
        };
        return this.sign(messages, fee);
    }
    createUnbondingDelegationTransaction(validator, amount) {
        const messages = [
            {
                typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
                value: {
                    delegatorAddress: this.address,
                    validatorAddress: validator,
                    amount: { denom: this.denom, amount },
                },
            },
        ];
        const fee = {
            amount: [{ denom: this.denom, amount: this.fee }],
            gas: this.stakingFeeGas,
        };
        return this.sign(messages, fee);
    }
    async createWithdrawDelegationTransaction(unusedValidator) {
        const withdrawValidators = await this.getProvider('balance2').getValidators(this.address);
        const messages = withdrawValidators.map((validator) => ({
            typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
            value: {
                delegatorAddress: this.address,
                validatorAddress: validator,
            },
        }));
        const fee = {
            amount: [{ denom: this.denom, amount: this.fee }],
            gas: this.claimFeeGas,
        };
        return this.sign(messages, fee);
    }
    async getInfo() {
        this.balance = this.calculateAvailableBalance(await this.getProvider('balance2').getTotalBalance(this.address)).toBN();
        await this.getStakingInfo();
        return {
            balance: this.balance,
            balances: this.balances,
        };
    }
    async fetchStakingInfo() {
        const explorer = this.getProvider('balance2');
        await explorer.getLatestBlock();
        const stakedValidators = {};
        const staked = this.calculateStakedBalance(await explorer.getStakedDelegations(this.address), stakedValidators);
        return {
            rewards: this.calculateRewards(await explorer.getRewardsBalance(this.address)),
            staked,
            unstaking: this.calculateUnstakingBalance(await explorer.getUnbondingDelegations(this.address)),
            validators: stakedValidators,
        };
    }
    // @TODO `total` param is not passed from `StakingMixin::makeStakingInfoStruct::calculateAvailableForStake`
    // probably it should be `balance`?
    async calculateAvailableForStake({ balance }) {
        const available = balance.toBN().sub(new this.BN(this.fee)).sub(new this.BN(this.reserveForStake));
        return new Amount(available.isNeg() ? '0' : available, this);
    }
    calculateTotal({ balance, staked, unstaking, rewards }) {
        return new Amount(balance.toBN().add(staked.toBN()).add(unstaking.toBN()).add(rewards.toBN()).toString(), this);
    }
    calculateAvailableBalance(available) {
        return new Amount(available.find((balance) => balance.denom === this.denom)?.amount ?? '0', this);
    }
    calculateRewards(rewards) {
        return new Amount(rewards?.find((reward) => reward.denom === this.denom)?.amount?.split('.')[0] ?? '0', this);
    }
    calculateStakedBalance(delegations, stakedValidators) {
        return new Amount(delegations?.length > 0 ? this.getTotalDelegations(delegations, stakedValidators).toString() : '0', this);
    }
    calculateUnstakingBalance(delegations) {
        const unbonding = { validators: {} };
        if (delegations?.length > 0) {
            const totalUnbonding = delegations.reduce((total, { entries, validator_address: validatorAddress }) => {
                const moniker = validatorAddress;
                unbonding.validators[moniker] = entries
                    .map((entry) => new this.BN(entry.balance.split('.')[0]))
                    .reduce((prev, cur) => prev.add(new this.BN(cur)), new this.BN('0'));
                return total.add(unbonding.validators[moniker]);
            }, new this.BN('0'));
            unbonding.total = totalUnbonding.toString().split('.')[0];
        }
        return new Amount(unbonding.total || '0', this);
    }
    getTotalDelegations(delegations, stakedValidators) {
        return delegations.reduce((total, { delegation, balance }) => {
            stakedValidators[delegation.validator_address] = {
                address: delegation.validator_address,
                staked: new Amount(new this.BN(balance.amount), this),
            };
            return total.add(new this.BN(balance.amount));
        }, new this.BN('0'));
    }
    /**
     * Sets the private key.
     *
     * @param {String} privateKey The private key WIF
     */
    setPrivateKey(privateKey, mnemonic) {
        this.#privateKey = privateKey;
        const path = stringToPath(this.derivation);
        DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
            hdPaths: [path],
            prefix: this.prefix,
        }).then((wallet) => {
            this.wallet = wallet;
        });
    }
    /**
     * Whether re-delegation to another validator is supported
     *
     * @returns {boolean}
     */
    isRedelegationSupported() {
        return true;
    }
}
export default COSMOSCoin;
//# sourceMappingURL=COSMOSCoin.js.map