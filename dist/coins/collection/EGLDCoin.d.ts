export default EGLDCoin;
declare const EGLDCoin_base: {
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
declare class EGLDCoin extends EGLDCoin_base {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        id: any;
    });
    derivation: string;
    gasPrice: any;
    gasLimit: any;
    stakingGasLimit: any;
    reserveForStake: any;
    loadWallet(seed: any, mnemonic: any): Promise<{
        id: any;
        privateKey: any;
        address: any;
    }>;
    address: any;
    createTransaction({ address, amount, data, gasLimit }: {
        address: any;
        amount: any;
        data?: string | undefined;
        gasLimit: any;
    }): Promise<any>;
    createDelegationTransaction({ validator, amount }: {
        validator: any;
        amount: any;
    }): Promise<any>;
    createUnDelegationTransaction({ validator, amount }: {
        validator: any;
        amount: any;
    }): Promise<any>;
    createClaimTransaction({ validator }: {
        validator: any;
    }): Promise<any>;
    createWithdrawTransaction({ validator }: {
        validator: any;
    }): Promise<any>;
    calculateTotal({ balance, staked, unstaking, availableWithdrawals, rewards }: {
        balance: any;
        staked: any;
        unstaking: any;
        availableWithdrawals: any;
        rewards: any;
    }): Amount;
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): Promise<Amount>;
    sendTransaction(rawtx: any): Promise<any>;
    nonce: any;
    getInfo(): Promise<{
        balance: any;
        balances: {};
    }>;
    balance: any;
    getFee({ gasLimit, userGasPrice }?: {}): BN;
    validateAddress(address: any): Promise<boolean>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Amount } from '../../utils/index.js';
import BN from 'bn.js';
