export default BNBCoin;
declare const BNBCoin_base: {
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
/**
 * Class for binance coin.
 *
 * @class BNBCoin
 */
declare class BNBCoin extends BNBCoin_base {
    /**
     * Сreates an instance of BNBCoin.
     * @param {*} alias
     * @param {*} feeData
     * @param {*} explorers
     * @param {*} txWebUrl
     * @memberof BNBCoin
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: any);
    /**
     * @typedef {import('@binance-chain/javascript-sdk').BncClient} BncClient
     */
    /** @type {BncClient|null} */
    bncClient: import("@binance-chain/javascript-sdk").BncClient | null;
    isBncClientInitialized: boolean;
    derivation: any;
    fee: any;
    freezeFee: any;
    reserveForStake: any;
    transactions: any[];
    tokens: {};
    /**
     * Inits and gets Binance client
     * @returns {Promise<BncClient>}
     */
    getBncClient(): Promise<import("@binance-chain/javascript-sdk").BncClient>;
    /**
     * Inits bncClient
     * @param {BncClient} bncClient
     * @returns {Promise<void>}
     */
    initBncClient(bncClient: import("@binance-chain/javascript-sdk").BncClient): Promise<void>;
    /**
     * Gets initialized bncClient
     * @returns {Promise<BncClient>}
     */
    getInitializedBncClient(): Promise<import("@binance-chain/javascript-sdk").BncClient>;
    freezeTokenBalanceOnce(params: any): {};
    unfreezeTokenBalanceOnce(params: any): {};
    /**
     * BNB user tokens request often takes >1 minute so skip await and don't block UI
     */
    get shouldSkipTokensFetchAwait(): boolean;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: any, mnemonic: BitcoreMnemonic): Promise<Object>;
    address: any;
    /**
     * Gets the transaction info.
     *
     * @param {String} txId The transaction identifier.
     * @return {Promise<Object>} The transaction.
     */
    getTransaction(txId: string): Promise<Object>;
    /**
     * Gets the public key.
     *
     * @return {String} The public key hex string.
     */
    getPublicKey(): string;
    /**
     * The address getter
     *
     * @return {string} { description_of_the_return_value }
     * @throws
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
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} asset Asset to send
     * @return {Object} Raw transaction
     */
    createTransaction({ address, amount, memo, asset }: string): Object;
    createDelegationTransaction({ account, toValidator, amount, symbol, sideChainId }: {
        account: any;
        toValidator: any;
        amount: any;
        symbol?: string | undefined;
        sideChainId?: string | undefined;
    }): {
        delegateAddress: any;
        validatorAddress: any;
        amount: any;
        symbol: string;
        sideChainId: string;
    };
    createUnDelegationTransaction({ account, toValidator, amount, symbol, sideChainId }: {
        account: any;
        toValidator: any;
        amount: any;
        symbol?: string | undefined;
        sideChainId?: string | undefined;
    }): {
        delegateAddress: any;
        validatorAddress: any;
        amount: any;
        symbol: string;
        sideChainId: string;
    };
    createReDelegationTransaction({ account, fromValidator, toValidator, amount, symbol, sideChainId }: {
        account: any;
        fromValidator: any;
        toValidator: any;
        amount: any;
        symbol?: string | undefined;
        sideChainId?: string | undefined;
    }): {
        delegateAddress: any;
        validatorSrcAddress: any;
        validatorDstAddress: any;
        amount: any;
        symbol: string;
        sideChainId: string;
    };
    sendDelegationTransaction(delegationTx: any): Promise<{
        txid: any;
    }>;
    sendUnDelegationTransaction(unDelegationTx: any): Promise<{
        txid: any;
    }>;
    sendReDelegationTransaction(reDelegationTx: any): Promise<{
        result: any;
        status: number;
    }>;
    createTokenTransaction(args: any): Promise<any>;
    /**
     * Signing an order
     *
     * @param  {<type>} order The order
     * @return {Promise} { description_of_the_return_value }
     */
    signOrder(order: <type>() => any): Promise<any>;
    /**
     * Converting string to HEX
     *
     * @param  {string} string The string
     * @return {string} { description_of_the_return_value }
     */
    toHex(string: string): string;
    /**
     * @return {Promise<BN>}
     */
    getFee(): Promise<BN>;
    /**
     * @return {Promise<BN>}
     */
    getFreezeFee(): Promise<BN>;
    /**
     * Calls for getBalance, does not calls for getTransactions
     *
     * @returns
     * @memberof BNBCoin
     */
    getInfo(): Promise<{
        balance: any;
        balances: {};
        transactions: never[];
    }>;
    /**
     * Get balance for BNB and assets
     *
     * @return {Promise<BN>}
     */
    getBalance(): Promise<BN>;
    balance: any;
    /**
     * Sends a transaction.
     *
     * @param {String} rawtx The rawtx
     * @return {Promise<Object>} The transaction data
     */
    sendTransaction({ address, amount, memo, asset }: string): Promise<Object>;
    sendMultiTransaction(outputs: any): Promise<{
        txid: any;
    }>;
    placeOrder(quantity: any, price: any, side?: number, address?: any, pairSymbol?: string, sequence?: null, timeInforce?: number): Promise<{
        result: any;
        status: number;
    }>;
    getPlaceOrderTx(hash: any): Promise<never[] | {
        result: any;
        status: number;
    }>;
    /**
     * Sets the private key.
     *
     * @param {string} privateKey The private key
     * @returns {Promise<void>}
     */
    setPrivateKey(privateKey: string): Promise<void>;
    initClientKey(privateKey: any): Promise<import("@binance-chain/javascript-sdk").BncClient>;
    /**
     * Creates a token.
     *
     * @param {...Array} args The arguments
     * @return {BNBToken}
     */
    createToken(args: any[][]): BNBToken;
    getTokenList(): any;
    /**
     * Fetches user token list from a coreLibrary.getBalance call
     *
     * @returns {Promise<Array<ServerToken>>} - list of the tokens that a user
     * have
     * @memberof BNBCoin
     */
    getUserTokenList(): Promise<Array<ServerToken>>;
    /**
     * Returns list of tickers for excluded tokens. BNB filter prevents double
     * creation of BNB asset (first is coin, second is token)
     *
     * @returns
     * @memberof BNBCoin
     */
    getExcludedTokenList(): string[];
    /**
     * Fetches transactions from the binance Explorer
     *
     * @param {*} [asset=TICKER] or symbol - binance symbol of a token (ticker)
     * @returns a list of transaction objects
     * @memberof BNBCoin
     */
    getTransactions({ address }?: any): Promise<any>;
    /**
     * Converts serverToken to internal token format
     *
     * @param {*} serverTokenObject
     * @param {*} source
     * @returns
     * @memberof BNBCoin
     */
    getTokenObject(serverTokenObject: any, source: any): {
        contract: any;
        name: any;
        ticker: any;
        decimal: number;
        parentTicker: string;
        uniqueField: any;
        confirmed: any;
        notify: boolean;
    };
    /**
     * Freeze provided amount of token
     *
     * @param tokenTicker
     * @param amount in currency units, not satoshis
     * @return {Promise<*>}
     */
    freezeTokenBalance(tokenTicker: any, amount: any): Promise<any>;
    /**
     *
     * @param tokenTicker
     * @param amount in currency unit, not satoshis
     * @return {Promise<*>}
     */
    unfreezeTokenBalance(tokenTicker: any, amount: any): Promise<any>;
    connectSocket(): Promise<void>;
    updateBalances(assets: any): Promise<void>;
    availableBalance(fees: any): Promise<any>;
    calculateTotal({ balance, staked, unstaking }: {
        balance: any;
        staked: any;
        unstaking: any;
    }): Amount;
    calculateAvailableForStake(): Promise<Amount>;
    #private;
}
import { Amount } from '../../utils/index.js';
import { BNBToken } from '../../tokens/index.js';
