export default XMRCoin;
declare const XMRCoin_base: {
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
declare class XMRCoin extends XMRCoin_base {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object} feeData the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id, atomicId }: string, db: any, configManager: any);
    derivation: string;
    coreLibrary: any;
    privateKeyView: string | null;
    privateKeySpend: string | null;
    publicKeySpend: any;
    info: {};
    /**
     * Loads a wallet
     * Mutates the wallet with created privateKey and the address obtained from the private key.
     *
     * @param {Buffer} seed - The mnemonic seed.
     * @param {string} [mnemonicString] - The mnemonic string.
     * @return {XMRCoin}
     */
    loadWallet(seed: Buffer, mnemonicString?: string): XMRCoin;
    /**
     * @typedef MyMoneroAccount
     * @property {string} address_string
     * @property {string} pub_viewKey_string
     * @property {string} pub_spendKey_string
     * @property {string} sec_viewKey_string
     * @property {string} sec_spendKey_string
     */
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
    address: string | undefined;
    /**
     * Validates wallet address
     *
     * @param {string} address - The address.
     * @return {boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Mutates the wallet with the requested balance and returns it
     *
     * @returns {Promise<{balance: string}>}
     */
    getInfo(): Promise<{
        balance: string;
    }>;
    /**
     * Gets the estimated fee for the transaction
     *
     * @async
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getFee(): Promise<string>;
    /**
     * Gets isSendAll sign by amount
     *
     * @param {string} amount
     * @returns {Promise<boolean>}
     */
    getIsSendAllByAmount(amount: string): Promise<boolean>;
    /**
     * @typedef MyMoneroTransactionOptions
     * @property Array.{to_address: string, send_amount: string} destinations - Array of transaction destinations.
     * @property {false} shouldSweep
     * @property {1} priority
     */
    /**
     * Creates options to create transaction in explorer
     *
     * @param {object} payload
     * @param {string} payload.address - To address.
     * @param {string} payload.amount - Amount of funds.
     * @param {boolean} payload.isSendAll - Amount of funds.
     * @returns {Promise<MyMoneroTransactionOptions>} - Raw transaction options
     * @throws {ExternalError}
     */
    createTransaction({ address, amount, memo, isSendAll: isSendAllRequested }: {
        address: string;
        amount: string;
        isSendAll: boolean;
    }): Promise<{
        /**
         * : string, send_amount: string} destinations - Array of transaction destinations.
         */
        "": to_address;
        shouldSweep: false;
        priority: 1;
    }>;
    activate(): Promise<void>;
    #private;
}
