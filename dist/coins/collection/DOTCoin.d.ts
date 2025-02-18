export default DOTCoin;
declare const DOTCoin_base: {
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
declare class DOTCoin extends DOTCoin_base {
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
    nonce: number;
    transactions: any[];
    loadWallet(seed: any, phrase: any): Promise<{
        id: any;
        privateKey: any;
        address: string;
    }>;
    address: string | undefined;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    getInfo(): Promise<{
        balance: any;
        balances: any;
    }>;
    balances: any;
    getLatestBlock(): any;
    getTxMeta(): any;
    getMetadata(): any;
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<any>;
    sign({ registry, construct, signingPayload, version, unsignedTx, metadata }: {
        registry: any;
        construct: any;
        signingPayload: any;
        version: any;
        unsignedTx: any;
        metadata: any;
    }): Promise<any>;
    sendTransaction(rawtx: any): Promise<any>;
    createDelegationTransaction(validator: any, amount: any): Promise<any>;
    createUnDelegationTransaction(amount: any): Promise<any>;
    setPrivateKey(privateKey: any): void;
    #private;
}
