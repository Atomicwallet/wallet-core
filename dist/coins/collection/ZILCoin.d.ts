export default ZILCoin;
declare const ZILCoin_base: {
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
declare class ZILCoin extends ZILCoin_base {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, stakingContract, stakingProxyContract, id }: string, db: any, configManager: any);
    derivation: string;
    zilliqa: Zilliqa;
    transactions: any[];
    tokens: {};
    nonce: number;
    setFeeData(feeData?: {}): void;
    fee: any;
    stakingProxyContract: any;
    stakingContract: any;
    stakingFeeGas: string | number | undefined;
    unstakingFeeGas: string | number | undefined;
    claimFeeGas: string | number | undefined;
    tokenFeeGas: string | number | undefined;
    sendFeeGas: string | number | undefined;
    gasLimit: string | undefined;
    gasSettings: any;
    reserveForStake: any;
    loadWallet(seed: any, phrase: any): Promise<{
        id: any;
        privateKey: any;
        address: string;
    }>;
    address: string | undefined;
    oldFormatAddressForBalance: string | undefined;
    getNonce(): number;
    getFee({ sendType, userGasPrice, gasLimit, isToken, }?: {
        sendType?: string | undefined;
        userGasPrice?: any;
        gasLimit?: string | number | undefined;
    }): Promise<any>;
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress(): string | WalletError;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    toValidChecksumAddress(address: any): Promise<string>;
    createTransaction({ address, amount, sendType }: {
        address: any;
        amount: any;
        sendType?: string | undefined;
    }): Promise<{
        version: number;
        toAddr: any;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
    }>;
    sendTransaction(rawtx: any): Promise<any>;
    getInfo(): Promise<{
        balance: any;
    }>;
    balance: any;
    setPrivateKey(privateKey: any): Promise<void>;
    fetchStakingInfo(): Promise<{
        staked: Amount;
        availableForUnstake: any;
        availableWithdrawals: Amount;
        pendingWithdrawals: Amount;
        rewards: Amount;
        validators: any;
    } | undefined>;
    calculateTotal({ balance, staked, rewards, availableWithdrawals, pendingWithdrawals }: {
        balance: any;
        staked: any;
        rewards: any;
        availableWithdrawals: any;
        pendingWithdrawals: any;
    }): Amount;
    calculateAvailableForUnstake(validators: any): any;
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): Promise<Amount>;
    calculateRewards(rewards?: Amount): Amount;
    changeProviders(explorers: any): void;
    balanceProvider: any;
    updateCoinParamsFromServer(data: any): void;
    createDelegationTransaction({ validator, amount }: {
        validator?: string | undefined;
        amount?: number | undefined;
    }): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    createUnDelegationTransaction({ validator, amount, gasPrice, gasLimit, }: {
        validator?: string | undefined;
        amount?: number | undefined;
        gasPrice?: any;
        gasLimit?: string | number | undefined;
    }): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    completeWithdrawal(): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    createClaimTransaction({ validator, gasPrice, gasLimit, }: {
        validator?: string | undefined;
        gasPrice?: any;
        gasLimit?: string | number | undefined;
    }): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    createTokenTransaction({ address, amount, contract }: {
        address: any;
        amount: any;
        contract: any;
    }): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    /**
     * Creates a token.
     *
     * @param {...Array} args The arguments
     * @return {ETHToken}
     */
    createToken(args: any[][]): ETHToken;
    getExcludedTokenList(): never[];
    fetchUserTokens(): Promise<never[]>;
    loadTokensList(wallets: any): Promise<void>;
    getGasLimit(sendType?: string): string | number | undefined;
    getGasPrice(sendType?: string): any;
    getGasRange(sendType?: string): any;
    #private;
}
import { Amount } from '../../utils/index.js';
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { WalletError } from '../../errors/index.js';
import { Long } from '@zilliqa-js/util';
