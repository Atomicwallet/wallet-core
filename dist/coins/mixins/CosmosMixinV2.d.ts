export default CosmosMixinV2;
declare function CosmosMixinV2(superclass: any): {
    new (config: any, db: any, configManager: any): {
        [x: string]: any;
        "__#12@#privateKey": any;
        gasPrice: any;
        useGasEstimate: any;
        estimatedGasCoefficient: any;
        loadWallet(seed: any, mnemonic: any): Promise<{
            id: any;
            privateKey: any;
            address: any;
        }>;
        address: any;
        /**
         * Validates wallet address
         *
         * @param {String} address The address
         * @return {Boolean}
         */
        validateAddress(address: string): boolean;
        getTransaction(txId: any): Promise<any>;
        getTransactions({ address, offset, limit, pageNum }: {
            address?: any;
            offset?: number | undefined;
            limit?: any;
            pageNum?: number | undefined;
        }): Promise<any>;
        transactions: any;
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
        setPrivateKey(privateKey: string, mnemonic: any): Promise<void>;
        wallet: any;
        /**
         * Whether re-delegation to another validator is supported
         *
         * @returns {boolean}
         */
        isRedelegationSupported(): boolean;
        /**
         * @typedef AmountObj
         * @type {object}
         *  @property {string} denom
         *  @property {string} amount - Number in string
         */
        /**
         * @typedef FeeObj
         * @type {object}
         *  @property {AmountObj[]} amount
         *  @property {string} gas
         */
        /**
         * @typedef FeeObjWithMessages
         * @type {object}
         *  @property {FeeObj} feeObj
         *  @property {object[]} messages
         */
        /**
         * Gets gas estimation by transaction simulation
         * @param {object}[] messages
         * @param {string} [memo]
         * @returns {Promise<string>} - Number in string
         */
        getGasEstimation(messages: any, memo?: string): Promise<string>;
        /**
         * @typedef FeeParams
         * @type object
         * @property {SEND_TYPE} sendType
         * @property {string} [address] - To address - only for simple send (coin)
         * @property {string} [validator],
         * @property {string} [fromValidator = null],
         * @property {object} [validatorsList[] = []],
         * @property {string} [amount],
         * @property {string} [memo='']
         */
        /**
         * Retrieve the gas fee from the configuration based on the provided send type.
         *
         * @param {SEND_TYPE} sendType - The type of send operation.
         * @returns {string} The gas fee based on the send type.
         */
        getGasFromConfig(sendType: SEND_TYPE): string;
        /**
         * Gets fee object
         * @param {FeeParams} params
         * @returns {Promise<FeeObjWithMessages>}
         */
        getFeeObjectWithMessages({ sendType, address, validator, fromValidator, validatorsList, amount, memo, }: {
            /**
             * - To address - only for simple send (coin)
             */
            address?: string | undefined;
            /**
             * ,
             */
            validator?: string | undefined;
            /**
             * ,
             */
            fromValidator?: string | undefined;
            /**
             * ,
             */
            validatorsList?: object | undefined;
            /**
             * ,
             */
            amount?: string | undefined;
            memo?: string | undefined;
        }): Promise<{
            feeObj: {
                amount: {
                    denom: string;
                    /**
                     * - Number in string
                     */
                    amount: string;
                }[];
                gas: string;
            };
            messages: object[];
        }>;
        /**
         * Retrieves another validator from the list of predefined validators that differs from the specified validator
         *
         * @param {string} validatorAddress - The address of the validator.
         * @returns {Promise<string>} - Different validator address.
         * @throws {Error} when not found another validator
         */
        getDifferentFromSpecifiedValidator(validatorAddress: string): Promise<string>;
        /**
         * Retrieves the fee for a specific send type.
         *
         * @param {FeeParams} [feeParams={}]
         * @returns Promise<{string}> Number in string
         */
        getFee({ sendType, address, validator, fromValidator, amount, memo }?: {
            /**
             * - To address - only for simple send (coin)
             */
            address?: string | undefined;
            /**
             * ,
             */
            validator?: string | undefined;
            /**
             * ,
             */
            fromValidator?: string | undefined;
            /**
             * ,
             */
            validatorsList?: object | undefined;
            /**
             * ,
             */
            amount?: string | undefined;
            memo?: string | undefined;
        }): Promise<any>;
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
        makeStakingInfoStruct({ staked, unstaking, delegatedVotes, availableVotes, pendingWithdrawals, availableWithdrawals, availableForUnstake, rewards, frozenVotes, frozenEnergy, validators, additional, }?: Amount): Promise<{
            unstaking: Amount;
            total: Amount;
            availableForStake: Amount;
        }>;
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
        calculateAvailableForUnstake(): void;
        calculateStakedAmount(): any;
        calculateUnstakingAmount(): void;
        calculateAvailableWithdrawalsAmount(): void;
        calculatePendingWithdrawalsAmount(): void;
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
};
import { Amount } from '../../utils/index.js';
type SEND_TYPE = any;
declare namespace SEND_TYPE {
    let STAKE: string;
    let UNSTAKE: string;
    let REDELEGATE: string;
    let CLAIM: string;
}
