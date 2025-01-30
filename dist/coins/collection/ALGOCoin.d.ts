export default ALGOCoin;
declare const ALGOCoin_base: {
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
declare class ALGOCoin extends ALGOCoin_base {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object} feeData the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string);
    derivation: string;
    transactions: any[];
    /**
     * Loads wallet from seed
     * @param  {} seed
     */
    loadWallet(seed: any): Promise<{
        id: any;
        privateKey: any;
        address: string;
    }>;
    address: string | undefined;
    getInfo(): Promise<{
        balance: any;
    }>;
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress(): string | WalletError;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    getLatestBlock(): any;
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<Uint8Array<ArrayBufferLike>>;
    signTransaction(txn: any): Promise<{
        txID: string;
        blob: Uint8Array;
    }>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { WalletError } from '../../errors/index.js';
