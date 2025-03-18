export default INJCoin;
declare const INJCoin_base: {
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
            rewards: import("../../index.js").Amount;
            staked: import("../../index.js").Amount;
            unstaking: import("../../index.js").Amount;
            validators: {};
        }>;
        calculateAvailableForStake({ balance }: {
            balance: any;
        }): Promise<import("../../index.js").Amount>;
        calculateTotal({ balance, staked, unstaking, rewards }: {
            balance: any;
            staked: any;
            unstaking: any;
            rewards: any;
        }): import("../../index.js").Amount;
        calculateAvailableBalance(available: any): import("../../index.js").Amount;
        calculateRewards(rewards: any): import("../../index.js").Amount;
        calculateStakedBalance(delegations: any, stakedValidators: any): import("../../index.js").Amount;
        calculateUnstakingBalance(delegations: any): import("../../index.js").Amount;
        getTotalDelegations(delegations: any, stakedValidators: any): any;
        setPrivateKey(privateKey: string, mnemonic: any): Promise<void>;
        wallet: any;
        isRedelegationSupported(): boolean;
        getGasEstimation(messages: any, memo?: string): Promise<string>;
        getGasFromConfig(sendType: any): string;
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
        getDifferentFromSpecifiedValidator(validatorAddress: string): Promise<string>;
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
        defaultAmount(): import("../../index.js").Amount;
        "__#11@#restoreCachedBalances"(): Promise<void>;
        "__#11@#updateCachedBalances"(balances: any): void;
        "__#11@#transformBalanceFieldFromJSON"(value: any): import("../../index.js").Amount;
        "__#11@#transformValidatorsObjectFromJSON"(validatorsJSONObject: any): {};
        "__#11@#transformCachedBalancesFromJSON"(balances?: any): {};
        setBalances(balances: any): void;
        isStakingSupported(): boolean;
        makeStakingInfoStruct({ staked, unstaking, delegatedVotes, availableVotes, pendingWithdrawals, availableWithdrawals, availableForUnstake, rewards, frozenVotes, frozenEnergy, validators, additional, }?: import("../../index.js").Amount): Promise<{
            unstaking: import("../../index.js").Amount;
            total: import("../../index.js").Amount;
            availableForStake: import("../../index.js").Amount;
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
        getDelegatedVotes(): import("../../index.js").Amount;
        getAvailableVotes(): import("../../index.js").Amount;
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
declare class INJCoin extends INJCoin_base {
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
    prefix: string;
    denom: string;
    sendFeeGas: any;
    stakingFeeGas: any;
    claimFeeGas: any;
    reStakingFeeGas: any;
    transactions: any[];
    minClaimSum: number;
    reserveForStake: any;
}
