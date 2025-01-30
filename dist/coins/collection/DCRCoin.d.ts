export default DCRCoin;
declare const DCRCoin_base: {
    new (): {
        [x: string]: any;
        "__#13@#privateKey": any;
        loadWallet(seed: string): Promise<Coin>;
        address: string | undefined;
        getNetwork(): Promise<any>;
        getDeriveFunctionName(): string;
        getAddress(): string;
        validateAddress(address: string): boolean;
        getTimestamp(): number;
        createTransaction({ address, amount, memo, userFee }: {
            address: any;
            amount: any;
            memo: any;
            userFee: any;
        }): Promise<any>;
        createTransactionSync({ inputs, outputs, fee }: {
            inputs: any;
            outputs: any;
            fee: any;
        }): Promise<any>;
        getScriptPubKey(): Promise<any>;
        decodeTransaction(rawtx: any): Promise<any>;
        getCoins({ address, value, feePerByte }: {
            address: any;
            value: any;
            feePerByte: any;
        }): Promise<any>;
        setPrivateKey(privateKey: any): void;
    };
    [x: string]: any;
};
/**
 * Class for decred.
 *
 * @class DCRCoin
 */
declare class DCRCoin extends DCRCoin_base {
    /**
     * constructs the object.
     *
     * @param {string} alias the alias
     * @param {string} fee the fee data
     * @param {string} feePerByte
     * @param {int} coefficient
     * @param {array}  explorers the explorers
     * @param {string} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string);
    derivation: string;
    feePerByte: any;
    coefficient: any;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount }: string): Promise<string>;
    #private;
}
