export default WAVESCoin;
/**
 * @class WAVESCoin
 */
declare class WAVESCoin extends Coin {
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
    /**
     * @param {Buffer} seed Seed buffer from BitcoreMnemonic
     * @param {String} phrase The mnemonic string
     * @return {Promise<Coin>} The private key.
     */
    loadWallet(seed: Buffer, phrase: string): Promise<Coin>;
    /**
     * @returns {Promise<Uint8Array>}
     */
    getPublicKeyArray(): Promise<Uint8Array>;
    /**
     * The address getter
     *
     * @return {String}
     */
    getAddress(): string;
    /**
     * Return public address
     *
     * @returns {Promise<string>}
     */
    getPublicAddress(): Promise<string>;
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
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount }: string): Promise<string>;
    signTransaction(unsignedTransaction: any): Promise<string>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Coin } from '../../abstract/index.js';
