export namespace LUNA_SEND_TYPES {
    let SEND: string;
    let STAKE: string;
    let UNSTAKE: string;
    let CLAIM: string;
}
export default LUNACoin;
declare const LUNACoin_base: {
    new (config: any, db: any, configManager: any): {
        [x: string]: any;
        "__#11@#balances": {};
        "__#11@#predefinedValidators": any[];
        readonly balances: {};
        readonly predefinedValidators: any[];
        defaultAmount(): Amount;
        "__#11@#restoreCachedBalances"(): Promise<void>;
        "__#11@#updateCachedBalances"(balances: any): void;
        "__#11@#transformBalanceFieldFromJSON"(value: any): Amount;
        "__#11@#transformValidatorsObjectFromJSON"(validatorsJSONObject: any): {};
        "__#11@#transformCachedBalancesFromJSON"(balances?: any): {};
        setBalances(balances: any): void;
        isStakingSupported(): boolean;
        isRedelegationSupported(): boolean;
        makeStakingInfoStruct({ staked, unstaking, delegatedVotes, availableVotes, pendingWithdrawals, availableWithdrawals, availableForUnstake, rewards, frozenVotes, frozenEnergy, validators, additional, }?: Amount): Promise<{
            unstaking: Amount;
            total: Amount;
            availableForStake: Amount;
        }>;
        fetchStakingInfo(): any;
        getStakingInfo(): Promise<any | {
            unstaking: string;
            total: string;
            availableForStake: string;
            pendingWithdrawals: string;
            validators: {};
            staked: string;
            availableWithdrawals: string;
            rewards: string;
        } | {}>;
        calculateTotal({ balance, staked, unstaking, availableWithdrawals, pendingWithdrawals, rewards }: {
            balance: any;
            staked: any;
            unstaking: any;
            availableWithdrawals: any;
            pendingWithdrawals: any;
            rewards: any;
        }): void;
        calculateAvailableForStake({ balance, staked, unstaking }: {
            balance: any;
            staked: any;
            unstaking: any;
        }): Promise<void>;
        calculateAvailableForUnstake(): void;
        calculateStakedAmount(): any;
        calculateUnstakingAmount(): void;
        calculateAvailableWithdrawalsAmount(): void;
        calculatePendingWithdrawalsAmount(): void;
        calculateRewards(): void;
        getValidators(): {};
        getTotalBalance(): string;
        getAvailableBalance(): string;
        getAvailableForUnstakeBalance(): any;
        "__#11@#getBalanceByType"(balanceType: string, validatorAddress: string): string;
        getStakedBalance(validator: any): string;
        getUnstakingBalance(validator: any): string;
        getRewards(validator: any): string;
        getDelegatedVotes(): Amount;
        getAvailableVotes(): Amount;
        getFrozenVotes(): any;
        getFrozenEnergy(): any;
        getPendingWithdrawals(validator: any): string;
        getAvailableWithdrawals(validator: any): string;
        getUserValidators(address: string): Promise<any>;
        getAdditionalInfo(): string;
        getPredefinedValidators(): Promise<[]>;
        getDefaultValidators(): any | any[];
        getPredefineValidatorsConfigIdentifier(): string;
        getPredefineValidatorsConfigName(): string;
    };
    [x: string]: any;
};
/**
 * Class for mainnet Terra 2.0
 *
 * @class LUNACoin
 */
declare class LUNACoin extends LUNACoin_base {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, isTestnet, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        isTestnet: any;
        id: any;
    }, db: any, configManager: any);
    derivation: string;
    BigNumber: typeof BigNumber;
    feeDenom: string;
    isTestnet: any;
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
    loadLib(): Promise<{
        RawKey: import("@terra-money/terra.js").RawKey;
        MsgSend: import("@terra-money/terra.js").MsgSend;
        AccAddress: import("@terra-money/terra.js").AccAddress;
        MnemonicKey: import("@terra-money/terra.js").MnemonicKey;
        MsgDelegate: import("@terra-money/terra.js").MsgDelegate;
        MsgUndelegate: import("@terra-money/terra.js").MsgUndelegate;
        Coin: import("@terra-money/terra.js").Coin;
        MsgWithdrawDelegatorReward: import("@terra-money/terra.js").MsgWithdrawDelegatorReward;
        Fee: import("@terra-money/terra.js").Fee;
    }>;
    setFeeData(feeData?: {}): void;
    gasLimit: any;
    gasPriceCoefficient: any;
    defaultGasPrice: any;
    reserveForStake: any;
    gasPrices: any;
    isFeeDynamic(): boolean;
    getTickerFromDenom(denom: any): any;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: any, phrase: any): Promise<Object>;
    /**
     * The address getter
     *
     * @return {string} { description_of_the_return_value }
     */
    getAddress(): string;
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Gas price
     *
     * @return {Promise<{BN}>}
     */
    getGasPrice(withoutCoeff?: boolean, isToken?: boolean): Promise<{
        BN: any;
    }>;
    getMsgSend(amountValue: any, addressFrom: any, addressTo: any, denom?: any): Promise<any>;
    /**
     * Gets the fee.
     *
     * @return {Promise<BN>} The fee.
     */
    getFee({ sendType }?: {
        sendType: string;
    }): Promise<BN>;
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @param {string} gasLimit
     * @param {number} multiplier coefficient
     * @return {Promise<string>} Raw transaction
     */
    createTransaction({ memo, amount, address, denom, sendType }: string): Promise<string>;
    gasPrice(): Promise<{
        BN: any;
    }>;
    setPrivateKey(privateKey: any, mnemonic: any): Promise<void>;
    address: any;
    publicKey: any;
    rawKey: any;
    getGasRange(sendType?: string): any;
    getInfo(): Promise<{
        balance: string | undefined;
    }>;
    balance: string | undefined;
    checkTransaction(txInfo: any): Promise<void>;
    getBalance(): Promise<string | undefined>;
    createDelegationTransaction(validator: any, amount: any, memo?: string): Promise<any>;
    createUnbondingDelegationTransaction(validator: any, amount: any, memo?: string): Promise<any>;
    createWithdrawDelegationTransaction(memo?: string): Promise<any>;
    fetchStakingInfo(): Promise<{
        rewards: Amount;
        staked: Amount;
        unstaking: Amount;
        validators: {};
    }>;
    estimateGas(): void;
    createFee(sendType?: string): Promise<any>;
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): Promise<Amount>;
    calculateTotal({ balance, staked, unstaking, rewards }: {
        balance: any;
        staked: any;
        unstaking: any;
        rewards: any;
    }): Amount;
    calculateAvailableBalance(available: any): Amount;
    calculateRewards(rewards: any): Amount;
    calculateStakedBalance(delegations: any, stakedValidators: any): Amount;
    calculateUnstakingBalance(delegations: any): Amount;
    getTotalDelegations(delegations: any, stakedValidators: any): any;
    createMsgsBySendType(sendType: any, { validator, amount, toAddress, validators, denom }: {
        validator: any;
        amount: any;
        toAddress: any;
        validators: any;
        denom: any;
    }): Promise<any> | Promise<any>[];
    createMsgSend({ amount, fromAddress, toAddress, denom }: {
        amount: any;
        fromAddress: any;
        toAddress: any;
        denom: any;
    }): Promise<any>;
    createMsgDelegate({ validator, amount }: {
        validator: any;
        amount: any;
    }): Promise<any>;
    createMsgUndelegate({ validator, amount }: {
        validator: any;
        amount: any;
    }): Promise<any>;
    createMsgsWithdraw({ validators }: {
        validators: any;
    }): Promise<any>;
    createAndSignTx(payload: any): Promise<any>;
    #private;
}
import { Amount } from '../../utils/index.js';
import BigNumber from 'bignumber.js';
