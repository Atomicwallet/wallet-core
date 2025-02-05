export default StakingMixin;
declare function StakingMixin(superclass: any): {
    new (config: any): {
        [x: string]: any;
        "__#11@#balances": {};
        "__#11@#predefinedValidators": any[];
        readonly balances: {};
        readonly predefinedValidators: any[];
        defaultAmount(): Amount;
        /**
         * Restore cached balances from localStorage
         * @return {Promise<void>}
         */
        "__#11@#restoreCachedBalances"(): Promise<void>;
        /**
         * Update cached balances
         * @param balances
         */
        "__#11@#updateCachedBalances"(balances: any): void;
        /**
         * Transform balances JSON object
         *
         * @param value
         * @returns {Amount}
         */
        "__#11@#transformBalanceFieldFromJSON"(value: any): Amount;
        /**
         * Transform validators JSON object
         * @param validatorsJSONObject
         * @returns {{}}
         */
        "__#11@#transformValidatorsObjectFromJSON"(validatorsJSONObject: any): {};
        /**
         * transform balances from JSON
         * @param {} balances
         * @return {{}}
         */
        "__#11@#transformCachedBalancesFromJSON"(balances?: any): {};
        /**
         * Setter replaced by method
         * to protect from occasional direct mutation
         *
         * @param balances
         */
        setBalances(balances: any): void;
        isStakingSupported(): boolean;
        /**
         * Whether re-delegation to another validator is supported
         *
         * @returns {boolean}
         */
        isRedelegationSupported(): boolean;
        /**
         *
         * @param {Amount} total
         * @param {Amount} staked
         * @param {Amount} delegatedVotes
         * @param {Amount} availableVotes
         * @param {Amount} unstaking
         * @param {Amount} pendingWithdrawals
         * @param {Amount} availableWithdrawals
         * @param {Amount} rewards
         * @param {{}} validators
         * @param {{}} additional
         * @returns {Promise<{
         * unstaking: Amount,
         * total: Amount,
         * availableForStake: Amount>,
         * availableVotes: Amount,
         * pendingWithdrawals: Amount,
         * validators: Amount,
         * staked: Amount,
         * delegatedVotes: Amount,
         * availableWithdrawals: Amount,
         * rewards: Amount
         * }>
         * }
         */
        makeStakingInfoStruct({ staked, unstaking, delegatedVotes, availableVotes, pendingWithdrawals, availableWithdrawals, availableForUnstake, rewards, frozenVotes, frozenEnergy, validators, additional, }?: Amount): Promise<{
            unstaking: Amount;
            total: Amount;
            availableForStake: Amount;
        }>;
        fetchStakingInfo(): any;
        /**
         * fetch and struct staking balances
         * @returns {Promise<any | {
         * unstaking: string,
         * total: string,
         * availableForStake: string,
         * pendingWithdrawals: string,
         * validators: {},
         * staked: string,
         * availableWithdrawals: string,
         * rewards: string} | {}>
         * }
         */
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
        /**
         * Calc Total balance
         * @param balance
         * @param staked
         * @param unstaking
         * @param availableWithdrawals
         * @param pendingWithdrawals
         * @abstract
         */
        calculateTotal({ balance, staked, unstaking, availableWithdrawals, pendingWithdrawals, rewards }: {
            balance: any;
            staked: any;
            unstaking: any;
            availableWithdrawals: any;
            pendingWithdrawals: any;
            rewards: any;
        }): void;
        /**
         * Calc available balance for stake
         * @param balance
         * @param staked
         * @param unstaking
         * @return {Promise<void>}
         * @abstract
         */
        calculateAvailableForStake({ balance, staked, unstaking }: {
            balance: any;
            staked: any;
            unstaking: any;
        }): Promise<void>;
        /**
         * Calculate available for unstake amount
         * @abstract
         */
        calculateAvailableForUnstake(): void;
        /**
         * calculate total staked amount
         * @returns {*}
         * @abstract
         */
        calculateStakedAmount(): any;
        /**
         * Calculate total Unstaking amount
         * @abstract
         */
        calculateUnstakingAmount(): void;
        /**
         * Calculate total Available withdrawals
         * @abstract
         */
        calculateAvailableWithdrawalsAmount(): void;
        /**
         * Calculate total Pending withdrawals
         * @abstract
         */
        calculatePendingWithdrawalsAmount(): void;
        /**
         * Calculate total Rewards
         * @abstract
         */
        calculateRewards(): void;
        /**
         * Return user validators-list from net
         * with validator addr as object field name
         * @returns {{}}
         */
        getValidators(): {};
        /**
         * Returs total balance
         *
         * @returns {string}
         */
        getTotalBalance(): string;
        /**
         * Return available balance for stake
         *
         * @returns {string}
         */
        getAvailableBalance(): string;
        getAvailableForUnstakeBalance(): any;
        /**
         * By default it returns balance by type and validator (if it is set)
         *
         * @param {string} balanceType The balance type e.g. rewards, staked and etc.
         * @param {string} validatorAddress The validator address
         * @returns {string}
         */
        "__#11@#getBalanceByType"(balanceType: string, validatorAddress: string): string;
        /**
         * By default, returns total staked balance
         * or for specific validator if validator address is passed
         *
         * @param validator Address for validator
         * @returns {string}
         */
        getStakedBalance(validator: any): string;
        /**
         * By default, returns total unstaking balance
         * or for specific validator if validator address is passed
         *
         * @param validator Address for validator
         * @returns {string}
         */
        getUnstakingBalance(validator: any): string;
        /**
         * By default, returns total rewards
         * or from specific validator if validator address is passed
         *
         * @param validator Address for validator
         * @returns {string}
         */
        getRewards(validator: any): string;
        /**
         * returns delegated votes
         * @returns {Amount}
         */
        getDelegatedVotes(): Amount;
        /**
         * returns available votes
         * @returns {Amount}
         */
        getAvailableVotes(): Amount;
        getFrozenVotes(): any;
        getFrozenEnergy(): any;
        /**
         * By default, returns total pending withdrawals
         * or from specific validator if validator address is passed
         *
         * @param validator Address for validator
         * @returns {string}
         */
        getPendingWithdrawals(validator: any): string;
        /**
         * By default, returns total available withdrawals
         * or from specific validator if validator address is passed
         *
         * @param validator Address for validator
         * @returns {string}
         */
        getAvailableWithdrawals(validator: any): string;
        /**
         * Fetch external validators list
         * currently used by address
         *
         * @param address {String}
         * @returns {Promise<*>}
         */
        getUserValidators(address: string): Promise<any>;
        getAdditionalInfo(): string;
        /**
         * Fetches remote predefined validators-list
         *
         * @returns {Promise<[]>}
         */
        getPredefinedValidators(): Promise<[]>;
        /**
         * Get local validators-list
         *
         * @returns {*|*[]}
         */
        getDefaultValidators(): any | any[];
        /**
         * Remote validators-list config identifier
         *
         * @returns {string}
         */
        getPredefineValidatorsConfigIdentifier(): string;
        /**
         * Remote validators-list config name
         *
         * @returns {string}
         */
        getPredefineValidatorsConfigName(): string;
    };
    [x: string]: any;
};
import { Amount } from '../../utils/index.js';
