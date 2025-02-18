declare const STXCoin_base: {
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
 * @class STXCoin
 */
export default class STXCoin extends STXCoin_base {
    /**
     * Constructs the object.
     *
     * @param {string} alias the alias
     * @param {array} feeData the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {string} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string, db: any, configManager: any);
    feeData: any;
    transactions: any[];
    /**
     * @param {Buffer} seed Seed buffer from BitcoreMnemonic
     * @param {string} phrase The mnemonic string
     * @return {Promise<Coin>} The private key.
     */
    loadWallet(seed: Buffer, phrase: string): Promise<Coin>;
    address: any;
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    getFee({ address, amount, memo }?: {}): Promise<any>;
    getNonce(): any;
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {Number} amount The amount to send
     * @return {Promise<StacksTransaction>} Raw transaction
     */
    createTransaction({ address, amount, memo }: string): Promise<StacksTransaction>;
    sendTransaction(tx: any): Promise<{
        txid: string;
    }>;
    getInfo(): Promise<{
        balance: any;
    }>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Coin } from '../../abstract/index.js';
export {};
