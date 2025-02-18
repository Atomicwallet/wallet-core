export default ETCCoin;
/**
 * @class ETCCoin
 */
declare class ETCCoin extends Coin {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        id: any;
    }, db: any, configManager: any);
    web3BaseUrl: any;
    web3: any;
    gasLimit: any;
    coefficient: any;
    blockscout: BlockscoutExplorer;
    /**
     * Sets web3 instance
     * @returns {Promise<void>}
     */
    setWeb3(): Promise<void>;
    /**
     * Gets web3 instance
     * @returns {Promise<*>}
     */
    getWeb3(): Promise<any>;
    /**
     * Gets the address.
     *
     * @return {String|Error} The address or error.
     */
    getAddress(): string | Error;
    /**
     * Loads a wallet.
     *
     * @param {Seed} seed The seed
     * @return {Promise}
     */
    loadWallet(seed: Seed): Promise<any>;
    /**
     * Validates the address.
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Gets the fee.
     *
     * @param  {Number}  amount In satoshis
     * @param  {Boolean} isSendAll The is send all (default: false)
     * @return {Promise<BN>} The fee.
     */
    getFee(): Promise<BN>;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} paymentData The payment id (only HEX value!)
     * @param {String} gas
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount, paymentData, gas }: string): Promise<string>;
    /**
     * Update dynamic data set
     *
     * @param {Object} data The data
     */
    updateCoinParamsFromServer(data: Object): Promise<void>;
    getInfo(): Promise<{
        balance: any;
    }>;
    getTransactions(...args: any[]): Promise<import("../../explorers/Transaction.js").default[]>;
    getGasPrice(): Promise<import("bn.js")>;
    sendTransaction(rawtx: any): Promise<any>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Coin } from '../../abstract/index.js';
import BlockscoutExplorer from '../../explorers/collection/BlockscoutExplorer.js';
