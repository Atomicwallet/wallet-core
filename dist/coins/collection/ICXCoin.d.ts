export default ICXCoin;
declare const ICXCoin_base: {
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
declare class ICXCoin extends ICXCoin_base {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string, db: any, configManager: any);
    derivation: string;
    fee: any;
    stepLimit: any;
    reserveForStake: any;
    transactions: any[];
    /**
     * @param {String} privateKey
     * @return {Wallet}
     */
    getICXWallet(privateKey: string): Wallet;
    loadWallet(seed: any): Promise<{
        id: any;
        privateKey: any;
        address: any;
    }>;
    address: any;
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress(privateKey?: any): string | WalletError;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    getInfo(): Promise<{
        balance: any;
        balances: {};
    }>;
    balance: any;
    getStakingInfo(): Promise<{}>;
    calculateTotal({ balance, staked, unstaking, rewards }: {
        balance: any;
        staked: any;
        unstaking: any;
        rewards: any;
    }): Amount;
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): Promise<Amount>;
    calculateAvailableForUnstake(stakeCall: any): Amount;
    calculateUnstakingAmount(stakeCall: any): Amount;
    calculateStakedAmount(stakeCall: any): Amount;
    calculateRewards(iScoreCall: any): Amount;
    signTransaction(transaction: any): Promise<any>;
    calculateAvailable(balance: any, fees: any): Promise<any>;
    availableBalance(fees: any): Promise<any>;
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<any>;
    createCallTransaction(method: any, params: any): Promise<any>;
    createStakeTransaction({ amount }: {
        amount: any;
    }): Promise<any>;
    stake({ amount, validator }: {
        amount: any;
        validator: any;
    }): Promise<any>;
    unstake(): Promise<any>;
    vote({ validator: validatorAddress, amount }: {
        validator: any;
        amount: any;
    }): Promise<any>;
    revote({ validator, amount }: {
        validator: any;
        amount: any;
    }): Promise<any>;
    getDelegateTransactionAmount(tx: any): Promise<any>;
    createClaimTransaction(): Promise<any>;
    claim(): Promise<any>;
    getClaimTransactionAmount(txResult: any): Promise<any>;
    getStakeTransactionAmount(txNode: any): Promise<any>;
    getTransactions({ offset, limit, address, pageNum }: {
        offset?: number | undefined;
        limit: any;
        address: any;
        pageNum: any;
    }): Promise<any>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Amount } from '../../utils/index.js';
import { WalletError } from '../../errors/index.js';
