export default HBARCoin;
declare const HBARCoin_base: {
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
declare class HBARCoin extends HBARCoin_base {
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
    grpc: any;
    fee: any;
    updateAccountFee: any;
    transactions: any[];
    /**
     * @typedef HederaSdkV2
     * @type {object}
     * @property {import('hedera-sdk-v2').Hbar} Hbar
     * @property {import('hedera-sdk-v2').Client} Client
     * @property {import('hedera-sdk-v2').AccountId} AccountId
     * @property {import('hedera-sdk-v2').PublicKey} PublicKey
     * @property {import('hedera-sdk-v2').PrivateKey} PrivateKey
     * @property {import('hedera-sdk-v2').TransferTransaction} TransferTransaction
     * @property {import('hedera-sdk-v2').AccountCreateTransaction} AccountCreateTransaction
     */
    /**
     * @async
     * @returns {Promise<HederaSdkV2>}
     */
    loadLib(): Promise<{
        Hbar: import("hedera-sdk-v2").Hbar;
        Client: import("hedera-sdk-v2").Client;
        AccountId: import("hedera-sdk-v2").AccountId;
        PublicKey: import("hedera-sdk-v2").PublicKey;
        PrivateKey: import("hedera-sdk-v2").PrivateKey;
        TransferTransaction: import("hedera-sdk-v2").TransferTransaction;
        AccountCreateTransaction: import("hedera-sdk-v2").AccountCreateTransaction;
    }>;
    /**
     * Gets fee for update account tx
     *
     * @return {string}
     */
    getFee(options: any): string;
    address: any;
    loadWallet(seed: any, phrase: any): Promise<{
        id: any;
        privateKey: any;
        address: any;
    }>;
    publicKey: any;
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress(): string | WalletError;
    /**
     * Try get accountID by publicKey
     * @param {String}  publicKey
     * @returns {Promise<String>}
     */
    getAddressByPublicKey(publicKey?: string): Promise<string>;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * get client v2
     * @returns {ClientV2}
     */
    getClient(): ClientV2;
    clientV2: any;
    /**
     * sign
     * @param tx
     * @returns {Promise<Transaction>}
     */
    signTransaction(tx: any): Promise<Transaction>;
    /**
     * Create transaction
     * @param address
     * @param amount
     * @returns {Promise<string>}
     */
    createTransaction({ address, amount, memo }: {
        address: any;
        amount: any;
        memo: any;
    }): Promise<string>;
    sendTransaction(signedTx: any): Promise<{
        txid: any;
    }>;
    /**
     * Method for create new accountID
     * @param publicKey
     * @param initialBalance
     * @returns {Promise<string>}
     */
    createAccountTransaction(publicKey: any, initialBalance: any): Promise<string>;
    getInfo(): Promise<{
        balance: any;
        balances: {};
    }>;
    balance: any;
    fetchStakingInfo(): Promise<{
        availableForUnstake: Amount;
        rewards: Amount;
        staked: Amount;
        validators: {};
    }>;
    calculateRewards(pendingReward: any): Amount;
    calculateStakedBalance(stakedNodeId: any): Amount;
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): Promise<Amount>;
    calculateTotal({ balance, rewards }: {
        balance: any;
        rewards: any;
    }): Amount;
    claim(): Promise<string>;
    stake({ validator }: {
        validator: any;
    }): Promise<string>;
    unstake(): Promise<string>;
    getTransactions(): Promise<any>;
    setPrivateKey(privateKey: any): Promise<void>;
    /**
     * Don't use it! Use the wallet itself, you don't need `instance`.
     * @private
     * @deprecated
     */
    private get instance();
    activate(): Promise<void>;
    #private;
}
import { Amount } from '../../utils/index.js';
import { WalletError } from '../../errors/index.js';
