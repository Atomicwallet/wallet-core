declare const SUICoin_base: {
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
export default class SUICoin extends SUICoin_base {
    constructor(walletsFeeConfig: any);
    derivation: string;
    loadWallet(seed: any, mnemonic: any): Promise<{
        id: any;
        privateKey: any;
        address: string;
    }>;
    keypair: import("@mysten/sui.js").Keypair | import("@mysten/sui.js").Ed25519Keypair | undefined;
    address: string | undefined;
    setPrivateKey(privateKey: any, phrase: any): Promise<void>;
    getTransactions(options: any): any;
    validateAddress(address: any): Promise<boolean>;
    getFee({ amount, address, isSendAll }?: {
        amount?: number | undefined;
        isSendAll?: boolean | undefined;
    }): Promise<any>;
    createTransaction({ address, amount, isSendAll }: {
        address: any;
        amount: any;
        isSendAll?: boolean | undefined;
    }): Promise<any>;
    sendTransaction(tx: any): Promise<{
        txid: any;
    }>;
    #private;
}
export {};
