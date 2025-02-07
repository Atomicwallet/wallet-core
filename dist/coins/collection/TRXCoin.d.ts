export default TRXCoin;
declare const TRXCoin_base: {
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
 * Class for bitcoin.
 *
 * @class TRXCoin
 */
declare class TRXCoin extends TRXCoin_base {
    /**
     * constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object} feeData the fee data
     * @param {Array}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string, db: any, configManager: any);
    derivation: string;
    transactions: any[];
    tokens: {};
    bannedTokens: any[];
    setFeeData(feeData?: {}): void;
    dynamicTrc20EnergyEnabled: boolean | undefined;
    loadTokensList(wallets: any): Promise<void>;
    fetchUserTokens(): Promise<never[]>;
    /**
     * Creates a token.
     *
     * @return {TRXToken}
     */
    createToken(args: any): TRXToken;
    /**
     * Loads a wallet.
     *
     * @param {Object} seed The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: Object): Promise<Object>;
    address: any;
    tronWeb: any;
    /**
     * The address getter
     *
     * @return {Promise<String>}
     */
    getAddress(): Promise<string>;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @param {String} network The network
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @return {Promise<Object>} Raw transaction
     */
    createTransaction({ address, amount }: string): Promise<Object>;
    createTokenTransaction(args: any): Promise<any>;
    sendTransaction({ address, amount, contract, userFee, transfer }: {
        address: any;
        amount: any;
        contract?: null | undefined;
        userFee?: null | undefined;
        transfer?: boolean | undefined;
    }): Promise<any>;
    sendTokenTransaction({ address, amount, contract, feeLimit }: {
        address: any;
        amount: any;
        contract: any;
        feeLimit: any;
    }): Promise<{
        txid: any;
    }>;
    encodeParameters(inputs: any): Promise<string>;
    sendRawTransaction(signedTransaction: any): Promise<{
        txid: any;
    }>;
    estimateDynamicEnergy({ address, amount, contract }: {
        address: any;
        amount: any;
        contract: any;
    }): Promise<any>;
    getFee({ contract, address, amount }: {
        contract: any;
        address: any;
        amount?: string | undefined;
    }): Promise<any>;
    getTRC20Fee(tx: any): any;
    getTransactions(): Promise<any>;
    getTransaction(txid: any): Promise<any>;
    isTRC20Token(key: any): boolean;
    getInfo(): Promise<{
        balance: any;
        balances: {};
    }>;
    balance: any;
    getStakingInfo(): Promise<{}>;
    getFrozenV1Votes(): any;
    calculateStakedAmount(votes: any): Amount;
    calculateFrozenVotes(frozenTotal: any): {
        frozenVotes: Amount;
    };
    calculateFrozenVotesV1(frozenVotes: any, frozenEnergy: any): {
        frozenVotesV1: Amount;
        frozenVotesExpiration: any;
    };
    calculateAvailableVotes(frozenVotes: any, usedVotes: any): Amount;
    calculateFrozenForWithdraw(unfrozenVotes?: any[]): {
        availableWithdrawals: Amount;
        pendingWithdrawals: Amount;
    };
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): Amount;
    calculateTotal({ balance, frozenVotes, rewards }: {
        balance: any;
        frozenVotes: any;
        rewards: any;
    }): Amount;
    calculateRewards(reward: any): Amount;
    setPrivateKey(privateKey: any): Promise<void>;
    createDelegationTransaction(validator: any, amount: any): Promise<any>;
    createFreezeTransaction(amount: any): Promise<{
        txid: any;
    }>;
    createVoteTransaction(validator: any, amount: any): Promise<any>;
    createUnfreezeTransaction(amount: any, v1?: boolean): Promise<{
        txid: any;
    }>;
    createWithdrawFrozenTransaction(): Promise<{
        txid: any;
    }>;
    createWithdrawRewardTransaction(): Promise<any>;
    /**
     * Returns all token list data
     * @returns {Promise<object[]>}
     */
    getTokenList(): Promise<object[]>;
    /**
     * Returns banned token list data
     * @returns {Promise<string[]>}
     */
    getBannedTokenList(): Promise<string[]>;
    #private;
}
import { Amount } from '../../utils/index.js';
import { TRXToken } from '../../tokens/index.js';
