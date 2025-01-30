export default XRPCoin;
/**
 * Class
 *
 * @class XRPCoin
 */
declare class XRPCoin extends Coin {
    /**
     * constructs the object.
     *
     * @param  {<type>} alias the alias
     * @param  {<type>} feeData the fee data
     * @param  {array}  explorers the explorers
     * @param  {<type>} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: <type>() => any);
    rippleApi: any;
    fee: any;
    isSubscribedToNewTxs: boolean;
    getRippleApi(): Promise<any>;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: any): Promise<Object>;
    /**
     * The address getter
     *
     * @return {String} { description_of_the_return_value }
     */
    getAddress(): string;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    sendTransaction(rawtx: any): Promise<{
        txid: any;
    }>;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} paymentId The payment id (only int!)
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount, memo }: string): Promise<string>;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} memo The payment id (only int!)
     * @return {Promise<String>} Raw transaction
     */
    createClaimFlareTransaction(MessageKey: any): Promise<string>;
    /**
     * @param {Number} amount In satoshis
     * @param isSendAll
     * @return {Promise<BN>}
     */
    getFee(): Promise<BN>;
    connectSocket(): Promise<void>;
    runSocketHealthcheck(): void;
    subscribeToNewTxs(): Promise<void>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Coin } from '../../abstract/index.js';
