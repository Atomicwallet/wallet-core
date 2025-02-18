export default XEMCoin;
/**
 * @class XEMCoin
 */
declare class XEMCoin extends Coin {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData: { fee }, explorers, txWebUrl, socket, id }: string, db: any, configManager: any);
    fee: any;
    transactions: any[];
    getNemLib(): Promise<any>;
    /**
     * Gets nem network id
     * @param {object} nem - Nem SDK library
     * @returns {number}
     */
    getNetworkId(nem: object): number;
    getAddressFromPublicKey(publicKey: any): Promise<any>;
    /**
     * @param {Buffer} seed Seed buffer from BitcoreMnemonic
     * @param {String} phrase The mnemonic string
     * @return {Promise<Coin>} The private key.
     */
    loadWallet(seed: Buffer, phrase: string): Promise<Coin>;
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
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} paymentId Nem "Message" or memo
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount, memo }: string): Promise<string>;
    signTransaction(unsignedTransaction: any): Promise<string>;
    /**
     * Update dynamic data set
     *
     * @param {Object} data The data
     */
    updateCoinParamsFromServer(data: Object): void;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Coin } from '../../abstract/index.js';
