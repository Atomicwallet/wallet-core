import BN from 'bn.js';
import { Coin } from '../../abstract/index.js';
import { WalletError } from '../../errors/index.js';
import IconExplorer from '../../explorers/collection/IconExplorer.js';
import IconNodeExplorer from '../../explorers/collection/IconNodeExplorer.js';
import { Amount, LazyLoadedLib } from '../../utils/index.js';
import { WALLET_ERROR } from '../../utils/const/index.js';
import { delayedRepeatUntilSuccess } from '../../utils/funcs.js';
import { HasProviders, StakingMixin } from '../mixins/index.js';
const bitcoinjsLib = new LazyLoadedLib(() => import('bitcoinjs-lib'));
const iconServiceLib = new LazyLoadedLib(() => import('icon-sdk-js'));
const NAME = 'ICON';
const TICKER = 'ICX';
const DERIVATION = "m/44'/74'/0'/0/0";
const DECIMAL = 18;
const DECIMAL_E = 1e18;
const UNSPENDABLE_BALANCE = '0';
const VERSION = 3;
const NETWORK_ID = 1;
const MS_IN_SECOND = 1000;
const ZERO_CONTRACT = 'cx0000000000000000000000000000000000000000';
const HEX_BASE = 16;
const UPDATE_TIMEOUT = 7500;
const REPEAT_BALANCE_REFRESH_TIMES = 3;
const ERROR_NO_BALANCE = 'Incorrect balance, possibly balance is not fetched';
const remove0xPrefix = (prefixedString) => prefixedString.replace('0x', '');
const txTypes = {
    STAKE: 'Stake',
    CLAIM: 'Claim reward',
    DELEGATE: 'Delegate',
};
const DEFAULT_RESERVE_FOR_STAKE = '1200000000000000000';
class ICXCoin extends StakingMixin(HasProviders(Coin)) {
    #privateKey;
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Explorer[]}  explorers the explorers
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
        this.setExplorersModules([IconExplorer, IconNodeExplorer]);
        this.loadExplorers(config);
        this.fee = feeData.fee;
        this.stepLimit = feeData.stepLimit;
        this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_FOR_STAKE;
        this.transactions = [];
        this.fields.paymentId = false;
    }
    /**
     * @param {String} privateKey
     * @return {Wallet}
     */
    async getICXWallet(privateKey) {
        const IconService = await iconServiceLib.get();
        return IconService.IconWallet.loadPrivateKey(privateKey);
    }
    async loadWallet(seed) {
        const hdPrivateKey = (await bitcoinjsLib.get()).bip32.fromSeed(seed);
        const key = hdPrivateKey.derivePath(this.derivation);
        if (!key) {
            throw new WalletError({
                type: WALLET_ERROR,
                error: new Error("can't get a privateKey!"),
                instance: this,
            });
        }
        const wallet = await this.getICXWallet(key.privateKey.toString('hex'));
        this.#privateKey = wallet.getPrivateKey();
        this.address = await wallet.getAddress();
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    async getAddress(privateKey = this.#privateKey) {
        if (privateKey) {
            const wallet = await this.getICXWallet(privateKey);
            return wallet.getAddress();
        }
        return new WalletError({
            type: WALLET_ERROR,
            error: new Error('privateKey is empty!'),
            instance: this,
        });
    }
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
        const IconService = await iconServiceLib.get();
        return IconService.IconValidator.isAddress(address);
    }
    async getInfo() {
        const info = await this.getProvider('balance').getInfo(this.address);
        info.balances = {
            available: this.toCurrencyUnit(await this.calculateAvailable(info.balance)),
            total: new BN(info.balance),
        };
        this.balance = info.balances.total;
        const balances = await this.getStakingInfo();
        return { balance: this.balance, balances };
    }
    async getStakingInfo() {
        const IconService = await iconServiceLib.get();
        const getStakeCall = new IconService.IconBuilder.CallBuilder()
            .from(this.address)
            .to(ZERO_CONTRACT)
            .method('getStake')
            .params({
            address: this.address,
        })
            .build();
        const stakeCallResult = await this.getProvider('call').call(getStakeCall);
        const delegation = await this.getProvider('call').call({
            to: ZERO_CONTRACT,
            dataType: 'call',
            data: {
                method: 'getDelegation',
                params: {
                    address: this.address,
                },
            },
        });
        const queryIScoreCall = new IconService.IconBuilder.CallBuilder()
            .from(this.address)
            .to(ZERO_CONTRACT)
            .method('queryIScore')
            .params({
            address: this.address,
        })
            .build();
        const iScore = await this.getProvider('call').call(queryIScoreCall);
        const staked = this.calculateStakedAmount(stakeCallResult);
        const availableForUnstake = this.calculateAvailableForUnstake(stakeCallResult);
        const unstaking = this.calculateUnstakingAmount(stakeCallResult);
        const rewards = this.calculateRewards(iScore);
        const delegatedVotes = new Amount(new BN(delegation?.totalDelegated.replace('0x', ''), HEX_BASE), this);
        const availableVotes = new Amount(new BN(delegation?.votingPower.replace('0x', ''), HEX_BASE), this);
        const validators = Object.fromEntries(delegation?.delegations.map(({ address, value }) => [
            address,
            { staked: new Amount(new BN(value.replace('0x', ''), HEX_BASE), this) },
        ]) || []);
        this.setBalances(await this.makeStakingInfoStruct({
            staked,
            unstaking,
            rewards,
            validators,
            delegatedVotes,
            availableVotes,
            availableForUnstake,
        }));
        return this.balances;
    }
    calculateTotal({ balance, staked, unstaking, rewards }) {
        return new Amount(balance.toBN().add(staked.toBN()).add(unstaking.toBN()).add(rewards.toBN()), this);
    }
    async calculateAvailableForStake({ balance }) {
        return new Amount(this.BN.max(balance.toBN().sub(new this.BN(this.reserveForStake)), new BN(0)), this);
    }
    calculateAvailableForUnstake(stakeCall) {
        return this.calculateStakedAmount(stakeCall);
    }
    calculateUnstakingAmount(stakeCall) {
        let unstakingBN = new BN(0);
        if (stakeCall.unstake) {
            unstakingBN = new BN(stakeCall.unstake.replace('0x', ''), HEX_BASE);
        }
        if (stakeCall.unstakes && stakeCall.unstakes.length > 0) {
            unstakingBN = stakeCall.unstakes.reduce((sum, { unstake }) => {
                return sum.add(new BN(unstake.replace('0x', ''), HEX_BASE));
            }, unstakingBN);
        }
        return new Amount(unstakingBN, this);
    }
    calculateStakedAmount(stakeCall) {
        if (stakeCall.stake) {
            return new Amount(new BN(stakeCall.stake.replace('0x', ''), HEX_BASE), this);
        }
        return this.defaultAmount();
    }
    calculateRewards(iScoreCall) {
        return new Amount(new BN(iScoreCall.estimatedICX.replace('0x', ''), HEX_BASE), this);
    }
    async signTransaction(transaction) {
        const IconService = await iconServiceLib.get();
        const wallet = await this.getICXWallet(this.#privateKey);
        return new IconService.SignedTransaction(transaction, wallet);
    }
    async calculateAvailable(balance, fees) {
        const maximumFee = (fees && new this.BN(fees)) || (await this.getFee());
        const available = new this.BN(balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));
        const zero = new this.BN(0);
        return this.BN.max(available, zero);
    }
    async availableBalance(fees) {
        const available = this.balances?.available;
        if (available) {
            return available;
        }
        const balance = this.balance;
        if (!balance) {
            return null;
        }
        const calculated = await this.calculateAvailable(balance, fees);
        return this.toCurrencyUnit(calculated);
    }
    async createTransaction({ address, amount }) {
        const IconService = await iconServiceLib.get();
        const transaction = new IconService.IconBuilder.IcxTransactionBuilder()
            .from(this.address)
            .to(address)
            .value(amount)
            .stepLimit(this.stepLimit)
            .nid(IconService.IconConverter.toBigNumber(NETWORK_ID))
            .nonce(IconService.IconConverter.toBigNumber(1))
            .version(IconService.IconConverter.toBigNumber(VERSION))
            .timestamp(new Date().getTime() * MS_IN_SECOND)
            .build();
        return this.signTransaction(transaction);
    }
    async createCallTransaction(method, params) {
        const IconService = await iconServiceLib.get();
        const transaction = new IconService.IconBuilder.CallTransactionBuilder()
            .from(this.address)
            .to(ZERO_CONTRACT)
            .value(0)
            .stepLimit(this.stepLimit)
            .nid(IconService.IconConverter.toBigNumber(NETWORK_ID))
            .nonce(IconService.IconConverter.toBigNumber(1))
            .version(IconService.IconConverter.toBigNumber(VERSION))
            .timestamp(new Date().getTime() * MS_IN_SECOND)
            .method(method)
            .params(params)
            .build();
        return this.signTransaction(transaction);
    }
    async createStakeTransaction({ amount }) {
        const IconService = await iconServiceLib.get();
        return this.createCallTransaction('setStake', {
            value: IconService.IconConverter.toHexNumber(amount),
        });
    }
    async stake({ amount, validator }) {
        if (!this.balances) {
            throw new Error(ERROR_NO_BALANCE);
        }
        const amountInMinimalUnits = new BN(this.toMinimalUnit(amount));
        // stake in ICX works in set mode, not add mode
        // i.e. if I stake 1 ICX and then 2 ICX result will be 2 ICX, not 3 ICX
        // this code emulates others coins behavior, so result will be 3 ICX
        const amountToStake = this.balances.stakedSatoshis
            ? this.balances.stakedSatoshis.add(amountInMinimalUnits)
            : amountInMinimalUnits;
        const stakeTransaction = await this.createStakeTransaction({
            amount: amountToStake.toString(),
        });
        await this.sendTransactionOnce(stakeTransaction);
        const txid = await this.vote({ validator, amount });
        // schedule balance update
        delayedRepeatUntilSuccess(this.getInfo.bind(this), [undefined], REPEAT_BALANCE_REFRESH_TIMES, UPDATE_TIMEOUT);
        return txid;
    }
    async unstake() {
        if (!this.balances) {
            throw new Error(ERROR_NO_BALANCE);
        }
        const info = await this.getInfo();
        if (Number(info.balances.delegatedVotes.toMinimal()) > 0) {
            const delegations = [];
            if (info.balances.validators) {
                Object.entries(info.balances.validators).forEach(([validator]) => {
                    delegations.push({ address: validator, value: '0x0' });
                });
            }
            const voteTx = await this.createCallTransaction('setDelegation', {
                delegations,
            });
            await this.sendTransactionOnce(voteTx);
        }
        const unstakeTransaction = await this.createStakeTransaction({
            amount: 0,
        });
        const { txid } = await this.sendTransaction(unstakeTransaction);
        delayedRepeatUntilSuccess(this.getInfo.bind(this), [undefined], REPEAT_BALANCE_REFRESH_TIMES, UPDATE_TIMEOUT);
        return txid;
    }
    async vote({ validator: validatorAddress, amount }) {
        const IconService = await iconServiceLib.get();
        const delegations = [];
        const info = await this.getInfo();
        let currentDelegation;
        if (info.balances?.validators && Number(info.balances.delegatedVotes) > 0) {
            info.balances.validators.forEach((delegatedValidator) => {
                if (delegatedValidator.address === validatorAddress) {
                    currentDelegation = delegatedValidator;
                }
                else {
                    delegations.push({
                        address: delegatedValidator.address,
                        value: delegatedValidator.value,
                    });
                }
            });
        }
        let amountInMinimalUnits = new BN(this.toMinimalUnit(amount));
        if (currentDelegation) {
            const delegated = new BN(remove0xPrefix(currentDelegation.value), HEX_BASE);
            amountInMinimalUnits = amountInMinimalUnits.add(delegated);
        }
        delegations.push({
            address: validatorAddress,
            value: IconService.IconConverter.toHexNumber(amountInMinimalUnits.toString()),
        });
        const voteTx = await this.createCallTransaction('setDelegation', {
            delegations,
        });
        const { txid } = await this.sendTransaction(voteTx);
        delayedRepeatUntilSuccess(this.getInfo.bind(this), [undefined], REPEAT_BALANCE_REFRESH_TIMES, UPDATE_TIMEOUT);
        return txid;
    }
    async revote({ validator, amount }) {
        const IconService = await iconServiceLib.get();
        const amountInMinimalUnits = new BN(this.toMinimalUnit(amount));
        const voteTx = await this.createCallTransaction('setDelegation', {
            delegations: [
                {
                    address: validator,
                    value: IconService.IconConverter.toHexNumber(amountInMinimalUnits),
                },
            ],
        });
        const { txid } = await this.sendTransaction(voteTx);
        delayedRepeatUntilSuccess(this.getInfo.bind(this), [undefined], REPEAT_BALANCE_REFRESH_TIMES, UPDATE_TIMEOUT);
        return txid;
    }
    async getDelegateTransactionAmount(tx) {
        const IconService = await iconServiceLib.get();
        let sum = IconService.IconConverter.toBigNumber(0);
        for (const delegation of tx.data.params.delegations) {
            sum = sum.plus(IconService.IconConverter.toBigNumber(delegation.value));
        }
        return sum.div(DECIMAL_E).toString();
    }
    async createClaimTransaction() {
        const tx = this.createCallTransaction('claimIScore', {});
        return this.signTransaction(tx);
    }
    async claim() {
        const claimIScoreCall = await this.createCallTransaction('claimIScore');
        const { txid } = await this.sendTransaction(claimIScoreCall);
        delayedRepeatUntilSuccess(this.getInfo.bind(this), [undefined], REPEAT_BALANCE_REFRESH_TIMES, UPDATE_TIMEOUT);
        return txid;
    }
    async getClaimTransactionAmount(txResult) {
        const IconService = await iconServiceLib.get();
        return IconService.IconConverter.toBigNumber(txResult.eventLogs[0].data[1]).div(DECIMAL_E).toString();
    }
    async getStakeTransactionAmount(txNode) {
        const IconService = await iconServiceLib.get();
        return IconService.IconConverter.toBigNumber(txNode.data.params.value).div(DECIMAL_E).toString();
    }
    async getTransactions({ offset = 0, limit, address, pageNum }) {
        const txs = await this.getProvider('history').getTransactions({
            address,
            offset,
            limit,
            pageNum,
        });
        const node = this.getProvider('call');
        if (!node) {
            return txs;
        }
        for (const tx of txs) {
            if (!tx.amount) {
                switch (tx.otherSideAddress) {
                    case txTypes.CLAIM:
                        {
                            const txResult = await node.getTransactionResult(tx.txid);
                            tx.amount = await this.getClaimTransactionAmount(txResult);
                        }
                        break;
                    case txTypes.STAKE:
                        {
                            const txNode = await node.getTransactionByHash(tx.txid);
                            tx.amount = await this.getStakeTransactionAmount(txNode);
                        }
                        break;
                    case txTypes.DELEGATE:
                        {
                            const txNode = await node.getTransactionByHash(tx.txid);
                            tx.amount = await this.getDelegateTransactionAmount(txNode);
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        return txs;
    }
    setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
    }
}
export default ICXCoin;
//# sourceMappingURL=ICXCoin.js.map