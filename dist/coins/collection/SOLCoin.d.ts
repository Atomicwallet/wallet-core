export default SOLCoin;
declare const SOLCoin_base: {
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
declare class SOLCoin extends SOLCoin_base {
    /**
     * constructs the object.
     *
     * @param  {object} config
     */
    constructor(config: object, db: any, configManager: any);
    derivation: string;
    fee: any;
    feeData: any;
    feePerByte: number;
    coefficient: number;
    reserveForStake: any;
    /** @type {{ [id: string]: SOLToken }} */
    tokens: {
        [id: string]: SOLToken;
    };
    /** @type {string[]} */
    bannedTokens: string[];
    getPrivateKey(): Buffer<ArrayBuffer>;
    loadWallet(seed: any): Promise<{
        id: any;
        privateKey: any;
        address: any;
    }>;
    address: any;
    /**
     * Creates unsigned transaction
     * @param {string} address
     * @param {string} amount
     * @returns {Promise<*>} Unsigned transaction
     */
    createTransaction({ address, amount }: string): Promise<any>;
    createTokenTransaction({ mint, address, amount, decimals, transfer }: {
        mint: any;
        address: any;
        amount: any;
        decimals: any;
        transfer: any;
    }): Promise<{
        mint: any;
        address: any;
        amount: any;
        decimals: any;
        transfer: any;
    }>;
    /**
     * Gets the fee
     *
     * @return {Promise<BN>} - The fee.
     */
    getFee(): Promise<BN>;
    /**
     * Gets the fee required to transfer the NFT
     *
     * @return {Promise<BN>} - The fee.
     */
    getNftFee(): Promise<BN>;
    sendTransaction(rawtx: any): Promise<any>;
    validateAddress(address: any): Promise<any>;
    connectSocket(): Promise<void>;
    /**
     * Generates a new pair of secret and public keys
     *
     * @param {import('@solana/web3.js').Keypair} Keypair
     * @param {import('tweetnacl').default} nacl
     * @param {any} [hdPrivateKey=null] - If not set - a new key will be generated
     * @returns {secretKey: Uint8Array, publicKey: PublicKey} The newly generated keys.
     */
    generateKeys(Keypair: import("@solana/web3.js").Keypair, nacl: import("tweetnacl").default, hdPrivateKey?: any): secretKey;
    createStakeAccount(address: any, amount: any): Promise<{
        createStakeAccountInstructions: any;
        stakePubkey: secretKey;
        stakeSeckey: secretKey;
        authorized: any;
        lockup: any;
    }>;
    createDelegationTransaction({ validator, amount }: {
        validator: any;
        amount: any;
    }): Promise<any>;
    /**
     * Deactivate stake account
     *
     * @param stakeAddress
     * @param ownerAddress
     * @returns {Promise<Transaction>}
     */
    createDeactivateStakeTransaction({ stakeAccount, ownerAddress }: {
        stakeAccount: any;
        ownerAddress?: any;
    }): Promise<Transaction>;
    /**
     * Withdraw DEACTIVATED only stake account
     *
     * @param stakeAddress
     * @param ownerAddress
     * @param amount
     * @returns {Promise<Buffer>}
     */
    createUndelegationTransaction({ stakeAccount, ownerAddress, amount }: {
        stakeAccount: any;
        ownerAddress?: any;
        amount: any;
    }): Promise<Buffer>;
    getInfo(props: any): Promise<{
        balance: any;
    }>;
    balance: any;
    fetchStakingInfo(): Promise<{
        staked: Amount;
        availableForUnstake: any;
        availableWithdrawals: any;
        pendingWithdrawals: any;
        validators: any;
    }>;
    calculateTotal({ balance, staked }: {
        balance: any;
        staked: any;
    }): Amount;
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): Promise<Amount>;
    calculateAvailableForUnstake(validators?: {}): any;
    calculateAvailableWithdrawalsAmount(validators?: {}): any;
    calculatePendingWithdrawalsAmount(validators?: {}): any;
    getAccountInfo(address: any): Promise<any>;
    /**
     * Fetch minimal amount for stake
     * @param length
     * @returns {*}
     */
    getMinRent(length?: number): any;
    convertToPubkey(address: any): Promise<any>;
    setPrivateKey(privateKey: any): void;
    /**
     * @typedef ConfigTokenShape
     * @type {object}
     * @property {string} name
     * @property {string} ticker
     * @property {number} decimal
     * @property {string} contract
     * @property {boolean} visibility
     *
     */
    /**
     * Returns all token list data
     *
     * @returns {Promise<ConfigTokenShape[]>}
     */
    getTokenList(): Promise<{
        name: string;
        ticker: string;
        decimal: number;
        contract: string;
        visibility: boolean;
    }[]>;
    /**
     * Returns banned token list
     *
     * @async
     * @returns {Promise<string[]>} - Array of contract addresses
     */
    getBannedTokenList(): Promise<string[]>;
    /**
     * @typedef ExplorerTokenShape
     * @type {object}
     * @property {string} name
     * @property {string} ticker
     * @property {number} decimal
     * @property {string} contract
     * @property {string} parentTicker
     * @property {string} uniqueField
     * @property {string[]} supportedStandards
     *
     */
    /**
     * Returns user token list data
     * @returns {Promise<ExplorerTokenShape[]>}
     */
    getUserTokenList(): Promise<{
        name: string;
        ticker: string;
        decimal: number;
        contract: string;
        parentTicker: string;
        uniqueField: string;
        supportedStandards: string[];
    }[]>;
    /**
     * Maps from common token list to internal token format
     * @returns {Promise<Array>}
     */
    getTokenFromCommonList(token: any, source: any): Promise<any[]>;
    /**
     * Maps from user token list to internal token format
     * @returns {Promise<Array>}
     */
    getTokenFromUserList(token: any, source: any): Promise<any[]>;
    /**
     * Creates a token.
     *
     * @param {object} args - The arguments.
     * @return {SOLToken}
     */
    createToken(args: object): SOLToken;
    /**
     * Gets token balance
     *
     * @param {string} mint - Token contract address.
     * @returns {Promise<string|null>}
     */
    getTokenInfo({ mint }: string): Promise<string | null>;
    /**
     * Sends a token transaction.
     *
     * @async
     * @param {object} options - The options for the token transaction.
     * @param {string} options.mint - The address of the token mint.
     * @param {string} options.address - The address of the recipient.
     * @param {number} options.amount - The amount of tokens to send.
     * @param {number} options.decimals - The number of decimal places for the token.
     * @return {Promise} A promise that resolves with the transaction result.
     */
    sendTokenTransaction({ mint, address, amount, decimals }: {
        mint: string;
        address: string;
        amount: number;
        decimals: number;
    }): Promise<any>;
    getTransactions(args: any): Promise<any>;
    #private;
}
import { Amount } from '../../utils/index.js';
import { SOLToken } from '../../tokens/index.js';
