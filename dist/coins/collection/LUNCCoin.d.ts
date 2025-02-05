export namespace LUNC_SEND_TYPES {
    let SEND: string;
    let STAKE: string;
    let UNSTAKE: string;
    let CLAIM: string;
}
export default LUNCCoin;
declare const LUNCCoin_base: {
    new (config: any): {
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
 * Class for classic Terra 1.0
 *
 * @class LUNCCoin
 */
declare class LUNCCoin extends LUNCCoin_base {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, isTestnet, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        isTestnet: any;
        id: any;
    });
    derivation: string;
    BigNumber: typeof BigNumber;
    bannedTokens: any[];
    isTestnet: any;
    tokens: {};
    nonce: number;
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
     * @property {import('@terra-money/terra.js').MsgBeginRedelegate} MsgBeginRedelegate
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
        MsgBeginRedelegate: import("@terra-money/terra.js").MsgBeginRedelegate;
        Fee: import("@terra-money/terra.js").Fee;
    }>;
    setFeeData(feeData?: {}): void;
    gasLimit: any;
    gasLimitCoefficient: any;
    gasPriceCoefficient: any;
    reserveForStake: any;
    resendTimeout: any;
    gasPrices: {
        [x: string]: string;
    } | {
        uluna: any;
    } | undefined;
    isFeeDynamic(): boolean;
    getTickerFromContractAddress(contractAddress: any): any;
    createToken(args: any): LUNCToken;
    /**
     * List to be excluded from wallets list
     * @return {string[]} array of tickers
     */
    getExcludedTokenList(): string[];
    /**
     *
     * @param {*} token - token object
     * @returns {boolean} - true if excluded
     */
    isTokenExcluded(token: any): boolean;
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
     * @return {Promise<boolean>}
     */
    validateAddress(address: string): Promise<boolean>;
    createMsgPayloadBySendType(sendType: any, { amount, validators, denom }: {
        amount: any;
        validators: any;
        denom: any;
    }): {
        validator: string;
        amount: any;
        validators?: undefined;
        fromAddress?: undefined;
        toAddress?: undefined;
        denom?: undefined;
    } | {
        validators: any;
        validator?: undefined;
        amount?: undefined;
        fromAddress?: undefined;
        toAddress?: undefined;
        denom?: undefined;
    } | {
        amount: any;
        fromAddress: any;
        toAddress: string;
        denom: any;
        validator?: undefined;
        validators?: undefined;
    };
    /**
     * @async
     * @returns {Promise<*>[]|Promise<*>}
     */
    createMsgsBySendType(sendType: any, { validator, amount, toAddress, validators, denom }: {
        validator: any;
        amount: any;
        toAddress: any;
        validators: any;
        denom: any;
    }): Promise<any>[] | Promise<any>;
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
    createMsgRedelegate({ fromValidator, validator, amount }: {
        fromValidator: any;
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
    isToken(denom: any): boolean;
    /**
     * Gets the fee.
     *
     * @return {Promise<BN>} The fee.
     */
    getFee({ custom, sendType, sendAmount, denom, address }?: {
        denom?: any;
        address?: string | undefined;
    }): Promise<BN>;
    estimateFeeAndTax({ sendType, gasLimit, amount, gasPrices, msgs, address, denom, memo }: {
        sendType: any;
        gasLimit: any;
        amount: any;
        gasPrices: any;
        msgs: any;
        address: any;
        denom: any;
        memo: any;
    }): Promise<{
        fee: any;
        tax: any;
    }>;
    getSigners(): Promise<{
        sequenceNumber: any;
        publicKey: any;
    }[]>;
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    availableBalance(fees: any): Promise<string>;
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
    /**
     * Returns user token list data
     * @returns {Promise<string[]>}
     */
    getUserTokenList(...args: any[]): Promise<string[]>;
    /**
     * Returns all token list data
     * @returns {Promise<Array>}
     */
    getTokenList(): Promise<any[]>;
    /**
     * Maps from user token list to internal token format
     * @returns {Promise<Array>}
     */
    getTokenFromUserList(token: any, source: any): Promise<any[]>;
    getTokenBase(token: any): {
        name: any;
        ticker: any;
        decimal: number;
        contract: any;
        parentTicker: any;
        uniqueField: any;
        confirmed: any;
        notify: any;
    };
    /**
     * Maps from common token list to internal token format
     * @returns {Promise<Array>}
     */
    getTokenFromCommonList(token: any, source: any): Promise<any[]>;
    gasPrice(): Promise<any>;
    setPrivateKey(privateKey: any, mnemonic: any): Promise<void>;
    address: any;
    publicKey: any;
    rawKey: any;
    getGasRange(sendType?: string): any;
    getInfo(tokenInfo: any): Promise<{
        balance: string | undefined;
    }>;
    balance: string | undefined;
    createTokenTransaction({ memo, denom, amount, address, multiplier }: {
        memo: any;
        denom: any;
        amount: any;
        address: any;
        multiplier: any;
    }): Promise<string>;
    getGasPrice(withoutCoeff?: boolean, isToken?: boolean): Promise<any>;
    /**
     * Gets gas prices from atomic services
     *
     * @async
     * @returns {Promise<Object.<string, string>>}
     */
    getGasPricesList(): Promise<{
        [x: string]: string;
    }>;
    getBalance(): Promise<string | undefined>;
    createAndSignTx(payload: any): Promise<any>;
    createDelegationTransaction(validator: any, amount: any, memo?: string): Promise<any>;
    createRedelegationTransaction(fromValidator: any, validator: any, amount: any, memo?: string): Promise<any>;
    createUnbondingDelegationTransaction(validator: any, amount: any, memo?: string): Promise<any>;
    createWithdrawDelegationTransaction(memo?: string): Promise<any>;
    sendTransaction(rawtx: any): Promise<{
        txid: any;
    }>;
    fetchStakingInfo(): Promise<{
        rewards: Amount;
        staked: Amount;
        unstaking: Amount;
        validators: {};
    }>;
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
    #private;
}
import { Amount } from '../../utils/index.js';
import BigNumber from 'bignumber.js';
import LUNCToken from '../../tokens/LUNCToken.js';
