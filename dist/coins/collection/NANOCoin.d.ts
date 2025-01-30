export default NANOCoin;
declare const NANOCoin_base: {
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
 * @class NANOCoin
 */
declare class NANOCoin extends NANOCoin_base {
    /**
     * Constructs the object.
     *
     * @param {string} alias the alias
     * @param {object} feeData the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {string} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string);
    derivation: string;
    transactions: any[];
    account_state: {};
    connectSocket(): void;
    getPublicKeyHexAndAccountKeyPair(accountBytes: any): Promise<{
        accountKeyPair: {
            publicKey: Uint8Array;
            secretKey: Uint8Array;
        };
        publicKeyHex: string;
    }>;
    /**
     * @param {Buffer} seed Seed buffer from BitcoreMnemonic
     * @param {string} phrase The mnemonic string
     * @return {Promise<{id: string, privateKey: string, address: string}>} The private key.
     */
    loadWallet(seed: Buffer, phrase: string): Promise<{
        id: string;
        privateKey: string;
        address: string;
    }>;
    address: any;
    /**
     * Return address
     *
     * @returns {Promise<{string}>}
     */
    getAddress(): Promise<{
        string: any;
    }>;
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {Promise<{boolean}>}
     */
    validateAddress(address: string): Promise<{
        boolean: any;
    }>;
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @return {Promise<string>} Raw transaction
     */
    createTransaction({ address, amount }: string): Promise<string>;
    /**
     * Create receive transaction
     *
     * @param {string} receiveBlockHash
     * @returns {Promise<string>}
     */
    createReceiveTransaction(receiveBlockHash: string): Promise<string>;
    /**
     * Generate address secret key from parent seed and account index
     *
     * @param seedBytes
     * @param accountIndex
     * @returns {Promise<{Uint8Array}>}
     */
    generateAccountSecretKeyBytes(seedBytes: any, accountIndex: any): Promise<{
        Uint8Array: any;
    }>;
    /**
     * Convert address to public key
     *
     * @param {string} address
     * @returns {Promise<{string}>}
     */
    getAccountPublicKey(address: string): Promise<{
        string: any;
    }>;
    /**
     * Generate keyPair from secret key
     *
     * @param accountSecretKeyBytes
     * @returns {Promise<{publicKey: Uint8Array, secretKey: Uint8Array}>}
     *
     */
    generateAccountKeyPair(accountSecretKeyBytes: any): Promise<{
        publicKey: Uint8Array;
        secretKey: Uint8Array;
    }>;
    /**
     * @param hexValue
     * @returns {Uint8Array}
     */
    hexToUint8(hexValue: any): Uint8Array;
    /**
     * @param decValue
     * @param bytes
     * @returns {string}
     */
    decToHex(decValue: any, bytes?: null): string;
    /**
     * @param payload
     * @param remainingBalance
     * @returns {Promise<{string}>}
     */
    signSendBlock(payload: any, remainingBalance: any): Promise<{
        string: any;
    }>;
    getWork(hash: any): Promise<any>;
    confirmAllPendingBlocks(): Promise<void>;
    confirmPendingBlock(block: any): Promise<void>;
    getTransactions(): Promise<any>;
    getInfo(): Promise<any>;
    /**
     * The function adds a pending transaction to the transaction history.
     * The database is not used intentionally, as when using the database,
     * there are problems with updating the hash of transactions already stored in
     * the database. More precisely, the hash is updated without problems, but
     * there is no code that would update the hash of the memory transaction.
     * See updatePendingOrCreate for the History class.
     * @param  Transaction tx
     */
    pushTx(tx: any): Promise<void>;
    setPrivateKey(privateKey: any): void;
    #private;
}
