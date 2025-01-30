export default ARKCoin;
declare class ARKCoin extends Coin {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string);
    /**
     * @typedef ArkecosystemCryptoObj
     * @type {object|null}
     * @property {object} Crypto
     * @property {object} Identities
     * @property {object} Transactions
     * @property {number} pubKeyHash
     */
    arkecosystemCryptoObj: null;
    fee: any;
    transactions: any[];
    /**
     * Inits and gets @arkecosystem/crypto lib
     * @returns {Promise<ArkecosystemCryptoObj>}
     */
    getArkecosystemCryptoObj(): Promise<object | null>;
    loadWallet(seed: any, mnemonic: any): Promise<any>;
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
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<any>;
    signTransaction(unsignedTx: any): any;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Coin } from '../../abstract/index.js';
import { WalletError } from '../../errors/index.js';
