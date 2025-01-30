export default XTZCoin;
declare const XTZCoin_base: {
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
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: <type>() => any);
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
    getBalance(): Promise<void>;
    balances: {
        available: any;
        staking: {
            total: any;
            validator: any;
        };
    } | undefined;
    getTransactions({ pageNum }?: {
        pageNum?: number | undefined;
    }): any;
    setPrivateKey(privateKey: any): void;
    #private;
}
