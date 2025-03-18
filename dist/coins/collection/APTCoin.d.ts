export default APTCoin;
export type LocalAccount = {
    /**
     * - Local aptos account.
     */
    account: AptosAccount | undefined;
    /**
     * } isRegistered - The sign that the account is registered on the blockchain.
     */
    false?: boolean | undefined;
};
declare const APTCoin_base: {
    new (): {
        [x: string]: any;
        processExplorerConfig(config: any): any;
        defaultProvider: any;
        providersMap: {} | undefined;
        getProvider(name: any): any;
        getBalance(): Promise<any>;
        getTransactions(args: any): Promise<any>;
        getInfo(): Promise<Object>;
        balance: any;
        getUnspentOutputs(address: any, scriptPubKey: any): Promise<any>;
        getUTXO(): any;
        sendTransaction(rawtx: any): any;
        getTransaction(txid: any): any;
        updateCoinParamsFromServer(config: Object): boolean;
        chainId: any;
        fee: any;
        stakingContract: any;
        stakingProxyContract: any;
        stakingFeeGas: any;
        reStakingFeeGas: any;
        unstakingFeeGas: any;
        claimFeeGas: any;
        tokenFeeGas: any;
        sendFeeGas: any;
    };
    [x: string]: any;
};
/**
 * @typedef LocalAccount
 * @property {AptosAccount | undefined} account - Local aptos account.
 * @property {boolean = false} isRegistered - The sign that the account is registered on the blockchain.
 */
declare class APTCoin extends APTCoin_base {
    constructor({ alias, feeData, explorers, txWebUrl, socket, id }: {
        alias: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        id: any;
    }, db: any, configManager: any);
    /** @type string | undefined */
    publicKey: string | undefined;
    derivation: string;
    /**
     * @typedef AptosSdk
     * @type {object}
     * @property {import('aptos').AptosAccount} AptosAccount
     * @property {import('aptos').AptosClient} AptosClient
     * @property {import('aptos').BCS} BCS
     * @property {import('aptos').HexString} HexString
     * @property {import('aptos').TxnBuilderTypes} TxnBuilderTypes
     */
    getLocalAccount(): LocalAccount;
    /**
     * @async
     * @returns {Promise<AptosSdk>}
     */
    loadLib(): Promise<{
        AptosAccount: import("aptos").AptosAccount;
        AptosClient: import("aptos").AptosClient;
        BCS: typeof import("aptos").BCS;
        HexString: import("aptos").HexString;
        TxnBuilderTypes: typeof import("aptos").TxnBuilderTypes;
    }>;
    setFeeData(feeData?: {}): void;
    /**
     * Returns expiration timestamp
     *
     * @return {bigint}
     */
    getTransactionExpirationTimeout(): bigint;
    address: any;
    /**
     * Sets privateKey and restores address from privateKey
     * Mutates the wallet with the address obtained from the private key.
     * Used as a faster method than loadWallet for address recovery.
     *
     * @param {string} privateKey - The private key.
     * @param {string} [mnemonicString]
     * @returns {Promise<void>}
     */
    setPrivateKey(privateKey: string, mnemonicString?: string): Promise<void>;
    /**
     * Loads a wallet
     * Mutates the wallet with created privateKey and the address obtained from the private key.
     *
     * @param {Buffer} seed - The mnemonic seed.
     * @param {string} [mnemonicString] - The mnemonic string.
     * @returns {Promise<{id: string, privateKey: string, address: string}>}
     */
    loadWallet(seed: Buffer, mnemonicString?: string): Promise<{
        id: string;
        privateKey: string;
        address: string;
    }>;
    /**
     * Validates address
     * Checks for 64 hex characters for a 32-byte account address.
     * @see https://aptos.dev/concepts/basics-accounts/
     *
     * @param {string} address - The address.
     * @returns {Promise<boolean>}
     */
    validateAddress(address: string): Promise<boolean>;
    /**
     * Mutates the wallet with the requested balance and returns it
     *
     * @returns {Promise<{balance: string | BN | null}>}
     * @throws {ExternalError}
     */
    getInfo(): Promise<{
        balance: string | BN | null;
    }>;
    /**
     * Gets the estimated gas price
     *
     * @returns {Promise<number>}
     */
    getGasPrice(): Promise<number>;
    /**
     * @typedef UserFeeOptions
     * @type {object}
     * @property {string | null} [userGasPrice=null] - Custom gas price.
     * @property {string | null} [gasLimit=null] - Custom gas limit.
     */
    /**
     * Gets gas params
     * @param {UserFeeOptions} userOptions
     * @returns {Promise<{gasPrice: number, gasLimit: number}>}
     */
    getGasParams({ userGasPrice, gasLimit: userGasLimit }?: {
        /**
         * - Custom gas price.
         */
        userGasPrice?: string | null | undefined;
        /**
         * - Custom gas limit.
         */
        gasLimit?: string | null | undefined;
    }): Promise<{
        gasPrice: number;
        gasLimit: number;
    }>;
    /**
     * Gets the estimated fee for the transaction
     *
     * @param {UserFeeOptions} [userOptions] - Custom priority
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getFee(userOptions?: {
        /**
         * - Custom gas price.
         */
        userGasPrice?: string | null | undefined;
        /**
         * - Custom gas limit.
         */
        gasLimit?: string | null | undefined;
    }): Promise<string>;
    getAccount(address?: any): any;
    /**
     * Creates a transaction to transfer funds
     *
     * @param {string} address - To address.
     * @param {string} amount - Amount of funds.
     * @param {string | null} [userGasPrice=null] - Custom gas price.
     * @param {string | null} [gasLimit=null] - Custom gas limit.
     * @returns {Promise<Uint8Array>} - Signed transaction
     * @throws {ExternalError}
     */
    createTransaction({ address, amount, userGasPrice, gasLimit: userGasLimit }: string): Promise<Uint8Array>;
    /**
     * Sends the transaction
     *
     * @async
     * @param {Uint8Array} bcsTxn - Raw transaction
     * @returns {Promise<{txid: string}>} - The transaction id.
     * @throws {ExternalError}
     */
    sendTransaction(bcsTxn: Uint8Array): Promise<{
        txid: string;
    }>;
    #private;
}
