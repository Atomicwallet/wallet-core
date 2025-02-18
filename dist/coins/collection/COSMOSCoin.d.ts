export default COSMOSCoin;
declare const COSMOSCoin_base: {
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
declare class COSMOSCoin extends COSMOSCoin_base {
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
    constructor(config: {
        id: string;
        ticker: string;
        name: string;
        prefix: string;
        denom: string;
        decimal: number;
        alias: string;
        features?: string[] | undefined;
        feeData: {
            fee: number;
            sendFeeGas: number;
            stakingFeeGas: number;
            reserveForStake: number;
            reStakingFeeGas: number;
            claimFeeGas: number;
            minClaimSum: number;
            unspendableBalance: number;
        };
        explorers: ExplorerConfig[];
        txWebUrl: string;
        socket: boolean;
        notify?: boolean | undefined;
    }, db: any, configManager: any);
    derivation: any;
    prefix: string;
    denom: string;
    fee: number;
    sendFeeGas: number;
    stakingFeeGas: number;
    reserveForStake: number;
    reStakingFeeGas: number;
    claimFeeGas: number;
    minClaimSum: number;
    transactions: any[];
    loadWallet(seed: any, mnemonic: any): Promise<{
        id: any;
        privateKey: any;
        address: string;
    }>;
    address: string | undefined;
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress(): string | WalletError;
    getSignKeys(): {
        privateKey: any;
        publicKey: string;
    };
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    getTransaction(txId: any): Promise<any>;
    getTransactions({ address, offset, limit, pageNum }: {
        address?: string | undefined;
        offset?: number | undefined;
        limit?: any;
        pageNum?: number | undefined;
    }): Promise<any[]>;
    getTransactionBlueprint({ type, ...params }: {
        [x: string]: any;
        type: any;
    }): Promise<any>;
    sign(messages: any, fee: any, memo?: string): Promise<any>;
    signer: any;
    createTransaction({ address, amount, memo }: {
        address: any;
        amount: any;
        memo?: string | undefined;
    }): Promise<any>;
    sendTransaction(txRaw: any): Promise<any>;
    createDelegationTransaction(validator: any, amount: any, memo?: string): Promise<any>;
    createRedelegationTransaction(fromValidator: any, validator: any, amount: any, memo?: string): Promise<any>;
    createUnbondingDelegationTransaction(validator: any, amount: any): Promise<any>;
    createWithdrawDelegationTransaction(unusedValidator: any): Promise<any>;
    getInfo(): Promise<{
        balance: import("bn.js");
        balances: {};
    }>;
    balance: import("bn.js") | undefined;
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
    /**
     * Sets the private key.
     *
     * @param {String} privateKey The private key WIF
     */
    setPrivateKey(privateKey: string, mnemonic: any): void;
    wallet: DirectSecp256k1HdWallet | undefined;
    #private;
}
import { Amount } from '../../utils/index.js';
import { WalletError } from '../../errors/index.js';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
