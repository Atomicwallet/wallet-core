export default XTZCoin;
declare const XTZCoin_base: {
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
 * Class
 *
 * @class XTZCoin
 */
declare class XTZCoin extends XTZCoin_base {
    /**
     * constructs the object.
     *
     * @param  {<type>} alias the alias
     * @param  {<type>} feeData the fee data
     * @param  {array}  explorers the explorers
     * @param  {<type>} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: <type>() => any, db: any, configManager: any);
    libsodiumWrappers: any;
    derivation: string;
    network: string;
    prefix: {
        tz1: Uint8Array<ArrayBuffer>;
        edpk: Uint8Array<ArrayBuffer>;
        edsk: Uint8Array<ArrayBuffer>;
        edsig: Uint8Array<ArrayBuffer>;
    };
    getLibsodiumWrappers(): Promise<any>;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: any): Promise<Object>;
    address: any;
    /**
     * The address getter
     *
     * @return {Promise<string>}
     */
    getAddress(): Promise<string>;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    create(operation: any): Promise<string>;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount }: string): Promise<string>;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @return {Promise<String>} Raw transaction
     */
    createDelegationTransaction(address: string): Promise<string>;
    sendTransaction(rawTx: any): Promise<{
        txid: any;
    }>;
    sign(rawTx: any): Promise<{
        bytes: any;
        sig: any;
        edsig: any;
        sbytes: string;
    }>;
    bs58EncodeWithPrefix(payload: any, prefix: any): Promise<any>;
    bs58Decode(enc: any, prefix: any): Promise<any>;
    buf2hex(buffer: any): string;
    hex2buf(hex: any): Uint8Array<any>;
    mergebuf(b1: any, b2: any): Uint8Array<any>;
    /**
     * Gets the balance.
     *
     * @return {Promise<BN>} The balance.
     */
    getInfo(): Promise<BN>;
    balance: any;
    getBalance(): Promise<any>;
    fetchStakingInfo(): Promise<{
        staked: Amount;
        validators: any;
    }>;
    calculateTotal({ balance }: {
        balance: any;
    }): any;
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): any;
    getTransactions({ pageNum }?: {
        pageNum?: number | undefined;
    }): any;
    getTransaction(txid: any): any;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Amount } from '../../utils/index.js';
