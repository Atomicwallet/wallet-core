export default NEARCoin;
declare const NEARCoin_base: {
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
 * @class NEARCoin
 */
declare class NEARCoin extends NEARCoin_base {
    /**
     * constructs the object.
     *
     * @param  {<type>} alias the alias
     * @param  {<type>} feeData the fee data
     * @param  {array}  explorers the explorers
     * @param  {<type>} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, network, id }: <type>() => any, db: any, configManager: any);
    derivation: string;
    bannedTokens: any[];
    unspendableBalance: string;
    network: any;
    tokens: {};
    nonce: any;
    activationAmount: string;
    setFeeData(feeData?: {}): void;
    gasLimit: string | undefined;
    gasLimitCoefficient: any;
    gasPriceCoefficient: any;
    stakingGas: any;
    stakingGasCoefficient: any;
    defaultGasPrice: any;
    resendTimeout: any;
    reserveForStake: any;
    get stakingGasLimit(): any;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: any, phrase: any): Promise<Object>;
    keyPair: import("near-api-js").KeyPair | undefined;
    address: string | undefined;
    /**
     * The address getter
     *
     * @return {String} { description_of_the_return_value }
     */
    getAddress(): string;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Create stake tx
     *
     * @param amount
     * @param validatorId
     * @param nonce
     * @returns {Promise<String>} base64 tx string
     */
    createDelegationTransaction({ amount, validator, nonce }: {
        amount: any;
        validator: any;
        nonce: any;
    }): Promise<string>;
    /**
     * Creates unstake tx
     * Unstaking takes 2-3 epochs to complete.
     *
     * @param amount
     * @param validatorId
     * @param nonce
     * @returns {Promise<String>} base64 tx string
     */
    createUnDelegationTransaction({ amount, validator, nonce }: {
        amount: any;
        validator: any;
        nonce: any;
    }): Promise<string>;
    /**
     * Creates withdraw tx
     * After the unstaking period of 2-3 epochs, you may withdraw your NEAR from staking pool.
     *
     * @param amount
     * @param validator
     * @param nonce
     * @returns {Promise<String>} base64 tx string
     */
    createWithdrawDelegationTransaction({ validator, nonce }: {
        validator: any;
        nonce: any;
    }): Promise<string>;
    getAccessKey(publicKey: any): any;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} paymentData The payment id (only HEX value!)
     * @param {String} gasLimit
     * @param {String} nonce
     * @param {String} userGasPrice
     * @param {Number} multiplier coefficient
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount, nonce }: string): Promise<string>;
    /**
     * Serialize raw transaction
     *
     * @param rawTx
     * @returns {Promise<{rawTx: *, txHash: Uint8Array}>}
     */
    serializeTransaction(rawTx: any): Promise<{
        rawTx: any;
        txHash: Uint8Array;
    }>;
    /**
     * Sign serialized transaction
     *
     * @param txHash
     * @param rawTx
     * @returns {Promise<string>}
     */
    signTransaction({ txHash, rawTx }: {
        txHash: any;
        rawTx: any;
    }): Promise<string>;
    /**
     * Serializes and sign transaction
     * @param rawTx
     * @returns {*}
     */
    serializeAndSignTransaction(rawTx: any): any;
    /**
     * Gets the fee.
     *
     * @return {Promise<BN>} The fee.
     */
    getFee({ userGasPrice, gasLimit, contract, address }?: {
        userGasPrice?: null | undefined;
        gasLimit?: null | undefined;
    }): Promise<BN>;
    getGasPrice(withoutCoeff?: boolean, isToken?: boolean): Promise<any>;
    estimateGas(amount: any, address: any, contract: any): Promise<any>;
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    availableBalance(fee: any): Promise<string>;
    _updateBalance(): Promise<void>;
    balance: any;
    updateBalance: lodash.DebouncedFuncLeading<() => Promise<void>>;
    getInfo(): Promise<{
        balance: any;
        balances: {};
    }>;
    getStakingInfo(): Promise<{
        balances: {};
    }>;
    calculateTotal({ balance, staked, unstaking }: {
        balance: any;
        staked: any;
        unstaking: any;
    }): Amount;
    calculateAvailableForStake(): Promise<Amount>;
    gasPrice(): Promise<any>;
    setPrivateKey(privateKey: any, phrase: any): void;
    checkTransaction(txInfo: any): Promise<void>;
    getBalance(): Promise<any>;
    #private;
}
import { Amount } from '../../utils/index.js';
import lodash from 'lodash';
