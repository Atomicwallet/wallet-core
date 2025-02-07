import BigNumber from 'bignumber.js';
import { Coin } from '../../abstract/index.js';
import TerraFCDExplorer from '../../explorers/collection/TerraFCDExplorer.js';
import TerraLCDExplorer from '../../explorers/collection/TerraLCDExplorer.js';
import { Amount, LazyLoadedLib } from '../../utils/index.js';
import { HasProviders, StakingMixin } from '../mixins/index.js';
export const LUNA_SEND_TYPES = {
    SEND: 'Send',
    STAKE: 'Stake',
    UNSTAKE: 'Unstake',
    CLAIM: 'Claim',
};
const NAME = 'Terra';
const TICKER = 'LUNA';
const DERIVATION = "m/44'/330'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';
const GWEI = 10 ** 9;
const DENOM = 'uluna';
const FEE_DENOM = 'uluna';
const MINIMAL_UNIT = 10 ** 6;
const FALLBACK_GASLIMIT = {
    [LUNA_SEND_TYPES.SEND]: 120000,
    [LUNA_SEND_TYPES.STAKE]: 800000,
    [LUNA_SEND_TYPES.UNSTAKE]: 800000,
    [LUNA_SEND_TYPES.CLAIM]: 3500000,
    max: 3500000,
};
const FALLBACK_GASPRICE = { uluna: '0.151' };
const TERRA_SDK = 'terraSdk';
/**
 * Class for mainnet Terra 2.0
 *
 * @class LUNACoin
 */
class LUNACoin extends StakingMixin(HasProviders(Coin)) {
    #privateKey;
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, isTestnet, id }, db, configManager) {
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
            denom: DENOM,
            dependencies: {
                [TERRA_SDK]: new LazyLoadedLib(() => import('@terra-money/terra.js')),
            },
        };
        super(config, db, configManager);
        this.derivation = DERIVATION;
        this.setExplorersModules([TerraFCDExplorer, TerraLCDExplorer]);
        this.loadExplorers(config);
        this.setFeeData(feeData);
        this.BigNumber = BigNumber;
        this.feeDenom = FEE_DENOM;
        this.isTestnet = isTestnet;
        this.fields.paymentId = true;
        this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
            this.eventEmitter.emit('socket::tx::confirmed', { id: coinId, ticker });
        });
    }
    /**
     * @typedef TerraSdk
     * @type {object}
     * @property {import('@terra-money/terra.js').RawKey} RawKey
     * @property {import('@terra-money/terra.js').MsgSend} MsgSend
     * @property {import('@terra-money/terra.js').AccAddress} AccAddress
     * @property {import('@terra-money/terra.js').MnemonicKey} MnemonicKey
     * @property {import('@terra-money/terra.js').MsgDelegate} MsgDelegate
     * @property {import('@terra-money/terra.js').MsgUndelegate} MsgUndelegate
     * @property {import('@terra-money/terra.js').Coin} Coin
     * @property {import('@terra-money/terra.js').MsgWithdrawDelegatorReward} MsgWithdrawDelegatorReward
     * @property {import('@terra-money/terra.js').Fee} Fee
     */
    /**
     * @async
     * @returns {Promise<TerraSdk>}
     */
    loadLib() {
        return super.loadLib(TERRA_SDK);
    }
    setFeeData(feeData = {}) {
        super.setFeeData(feeData);
        this.gasLimit = feeData.gasLimit;
        this.gasPriceCoefficient = feeData.gasPriceCoefficient;
        this.defaultGasPrice = feeData.defaultGasPrice;
        this.reserveForStake = feeData.reserveForStake;
        this.gasPrices = {
            uluna: feeData.defaultGasPrice?.uluna || FALLBACK_GASPRICE.uluna,
        };
    }
    isFeeDynamic() {
        return true;
    }
    getTickerFromDenom(denom) {
        if (!denom) {
            return '';
        }
        if (denom[0] === 'u') {
            const sliced = denom.slice(1);
            if (sliced.length > 3) {
                return sliced === TICKER.toLowerCase() ? TICKER : sliced.toUpperCase();
            }
            return `${sliced.slice(0, 2).toUpperCase()}T`;
        }
        return denom;
    }
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    async loadWallet(seed, phrase) {
        const { MnemonicKey } = await this.loadLib();
        const key = new MnemonicKey({ mnemonic: phrase });
        await this.setPrivateKey(key.privateKey.toString('hex'));
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    /**
     * The address getter
     *
     * @return {string} { description_of_the_return_value }
     */
    getAddress() {
        return this.#privateKey ? this.address : new Error(`${this.ticker} private key is empty`);
    }
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {boolean}
     */
    async validateAddress(address) {
        const { AccAddress } = await this.loadLib();
        return AccAddress.validate(address);
    }
    /**
     * Gas price
     *
     * @return {Promise<{BN}>}
     */
    getGasPrice(withoutCoeff = false, isToken = false) {
        const gasPrice = this.defaultGasPrice[this.feeDenom];
        let bignumber = new this.BigNumber(gasPrice);
        bignumber = withoutCoeff
            ? bignumber
            : bignumber.plus(isToken ? this.tokenGasPriceCoefficient : this.gasPriceCoefficient);
        bignumber = bignumber.times(GWEI).dividedBy(MINIMAL_UNIT).integerValue(this.BigNumber.ROUND_CEIL).times(GWEI);
        return new this.BN(bignumber.toFixed());
    }
    async getMsgSend(amountValue, addressFrom, addressTo, denom = this.denom) {
        const { MsgSend } = await this.loadLib();
        return new MsgSend(addressFrom, addressTo, {
            [denom]: amountValue,
        });
    }
    /**
     * Gets the fee.
     *
     * @return {Promise<BN>} The fee.
     */
    async getFee({ sendType } = { sendType: LUNA_SEND_TYPES.SEND }) {
        const amount = (await this.createFee(sendType)).amount.toString().replace('uluna', '');
        return new this.BN(amount);
    }
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @param {string} gasLimit
     * @param {number} multiplier coefficient
     * @return {Promise<string>} Raw transaction
     */
    async createTransaction({ memo, amount, address, denom = this.denom, sendType }) {
        sendType = sendType?.toLowerCase() || LUNA_SEND_TYPES.SEND;
        const [sendMsg, gasPrices] = await Promise.all([
            this.createMsgSend({
                amount,
                fromAddress: this.address,
                toAddress: address,
                denom,
            }),
            this.getProvider('gas_price')
                .getGasPrices()
                .catch(() => {
                console.warn('Could not get gasPrices');
                // @TODO implement logger
                return this.gasPrices;
            }),
        ]);
        this.gasPrices = gasPrices;
        const fee = await this.createFee(sendType);
        return this.createAndSignTx({
            msgs: [sendMsg],
            memo,
            fee,
        });
    }
    gasPrice() {
        return this.getGasPrice();
    }
    async setPrivateKey(privateKey, mnemonic) {
        const { RawKey } = await this.loadLib();
        const key = new RawKey(Buffer.from(privateKey, 'hex'));
        this.#privateKey = key.privateKey.toString('hex');
        this.address = key.accAddress;
        this.publicKey = key.publicKey.key;
        this.rawKey = key;
    }
    getGasRange(sendType = 'send') {
        return this.feeData[sendType];
    }
    async getInfo() {
        try {
            const balance = await this.getProvider('balance').getBalance(this.address, false, this.denom);
            if (typeof balance !== 'string') {
                throw new TypeError(`[${this.ticker}] can't get balance`);
            }
            this.balance = balance;
        }
        catch (error) {
            // @TODO implement logger
        }
        try {
            await this.getStakingInfo();
        }
        catch (error) {
            console.warn('Could not get staking info');
            // @TODO implement logger
        }
        return { balance: this.balance };
    }
    async checkTransaction(txInfo) {
        super.checkTransaction({
            feeTicker: this.getTickerFromDenom(this.feeDenom),
            ...txInfo,
        });
    }
    async getBalance() {
        return (await this.getInfo()).balance;
    }
    async createDelegationTransaction(validator, amount, memo = '') {
        const [msg, fee] = await Promise.all([
            this.createMsgDelegate({ validator, amount }),
            this.createFee(LUNA_SEND_TYPES.STAKE),
        ]);
        return this.createAndSignTx({
            msgs: [msg],
            memo,
            fee,
        });
    }
    async createUnbondingDelegationTransaction(validator, amount, memo = '') {
        const [msg, fee] = await Promise.all([
            this.createMsgUndelegate({ validator, amount }),
            this.createFee(LUNA_SEND_TYPES.UNSTAKE),
        ]);
        return this.createAndSignTx({
            msgs: [msg],
            memo,
            fee,
        });
    }
    async createWithdrawDelegationTransaction(memo = '') {
        const [validators] = await this.getProvider('balance').getValidators(this.address);
        const [msgs, fee] = await Promise.all([
            this.createMsgsWithdraw({
                validators: validators.map(({ operator_address: address }) => address),
            }),
            this.createFee(LUNA_SEND_TYPES.UNSTAKE),
        ]);
        return this.createAndSignTx({
            msgs,
            memo,
            fee,
        });
    }
    async fetchStakingInfo() {
        const explorer = this.getProvider('balance');
        const stakedValidators = {};
        const staked = this.calculateStakedBalance(await explorer.getStakedDelegations(this.address), stakedValidators);
        const rewards = this.calculateRewards(await explorer.getRewardsBalance(this.address));
        const unstaking = this.calculateUnstakingBalance(await explorer.getUnbondingDelegations(this.address));
        return {
            rewards,
            staked,
            unstaking,
            validators: stakedValidators,
        };
    }
    estimateGas() {
        // this is a placeholder for frontend call, does not affects operations
    }
    async createFee(sendType = LUNA_SEND_TYPES.SEND) {
        const gas = Number(this.gasLimit?.[sendType]) || FALLBACK_GASLIMIT[sendType];
        const price = Number(this.gasPrices?.uluna) || Number(FALLBACK_GASPRICE.uluna);
        const amount = (gas * price).toFixed(0);
        const { Fee } = await this.loadLib();
        return new Fee(gas, {
            uluna: amount,
        });
    }
    async calculateAvailableForStake({ balance }) {
        const available = balance
            .toBN()
            .sub(new this.BN(await this.getFee({ sendType: LUNA_SEND_TYPES.STAKE })))
            .sub(new this.BN(this.reserveForStake));
        return new Amount(available.isNeg() ? '0' : available, this);
    }
    calculateTotal({ balance, staked, unstaking, rewards }) {
        return new Amount(balance.toBN().add(staked.toBN()).add(unstaking.toBN()).add(rewards.toBN()).toString(), this);
    }
    calculateAvailableBalance(available) {
        return new Amount(available.find((balance) => balance.denom === this.denom)?.amount ?? '0', this);
    }
    calculateRewards(rewards) {
        return new Amount(rewards.total?._coins?.uluna?.amount?.toString().split('.')[0] || '0', this);
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
                    .map((entry) => new this.BN(entry.balance.toString()))
                    .reduce((prev, cur) => prev.add(new this.BN(cur)), new this.BN('0'));
                return total.add(unbonding.validators[moniker]);
            }, new this.BN('0'));
            unbonding.total = totalUnbonding;
        }
        return new Amount(unbonding.total || '0', this);
    }
    getTotalDelegations(delegations, stakedValidators) {
        return delegations.reduce((total, { validator_address: address, balance }) => {
            stakedValidators[address] = {
                address,
                staked: new Amount(new this.BN(balance.amount.toString()), this),
            };
            return total.add(new this.BN(balance.amount.toString()));
        }, new this.BN('0'));
    }
    createMsgsBySendType(sendType, { validator, amount, toAddress, validators, denom }) {
        switch (sendType) {
            case LUNA_SEND_TYPES.STAKE:
                return [this.createMsgDelegate({ validator, amount })];
            case LUNA_SEND_TYPES.UNSTAKE:
                return [this.createMsgUndelegate({ validator, amount })];
            case LUNA_SEND_TYPES.CLAIM:
                return this.createMsgsWithdraw({ validators });
            default:
                return [
                    this.createMsgSend({
                        amount,
                        fromAddress: this.address,
                        toAddress,
                        denom,
                    }),
                ];
        }
    }
    async createMsgSend({ amount, fromAddress, toAddress, denom }) {
        const { MsgSend } = await this.loadLib();
        return new MsgSend(fromAddress, toAddress, {
            [denom]: amount,
        });
    }
    async createMsgDelegate({ validator, amount }) {
        const { Coin: TerraAmount, MsgDelegate } = await this.loadLib();
        const terraAmount = new TerraAmount(this.denom, String(amount));
        return new MsgDelegate(this.address, validator, terraAmount);
    }
    async createMsgUndelegate({ validator, amount }) {
        const { Coin: TerraAmount, MsgUndelegate } = await this.loadLib();
        const terraAmount = new TerraAmount(this.denom, String(amount));
        return new MsgUndelegate(this.address, validator, terraAmount);
    }
    async createMsgsWithdraw({ validators }) {
        const { MsgWithdrawDelegatorReward } = await this.loadLib();
        return validators.map((validator) => {
            return new MsgWithdrawDelegatorReward(this.address, validator);
        });
    }
    async createAndSignTx(payload) {
        return this.getProvider('node').getLcdWallet(this.rawKey).createAndSignTx(payload);
    }
}
export default LUNACoin;
//# sourceMappingURL=LUNACoin.js.map