export default BTGCoin;
declare const BTGCoin_base: {
    new (): {
        [x: string]: any;
        "__#14@#privateKey": any;
        loadWallet(seed: any): Promise<Object>;
        address: string | undefined;
        getNetwork(): Promise<any>;
        getAddress(privateKey?: any): string;
        getAddressFromPublicKey(publicKey: any): Promise<any>;
        validateAddress(address: string): boolean;
        getTransactionBuilder(): Promise<any>;
        addInput(txBuilder: any, input: any): void;
        signInput(txBuilder: any, keyForSign: any, index: any, input: any): void;
        createClaimTransaction(privateKey: string): Promise<string>;
        createTransaction({ address, amount }: string): Promise<string>;
        buildTx(inputs: any, address: any, amount: any, change: any, privateKey: any, otherSideAddr: undefined, version: any): Promise<any>;
        getKeyForSignFromPrivateKey(privateKey?: any): Promise<any>;
        getScriptPubKey(): Promise<any>;
        setPrivateKey(privateKey: any): void;
    };
    [x: string]: any;
};
/**
 * Class for Bitcoin gold coin
 *
 * @class BTGCoin
 */
declare class BTGCoin extends BTGCoin_base {
    /**
     * constructs the object.
     *
     * @param  {<type>} alias the alias
     * @param  {<type>} feeData the fee data
     * @param  {array}  explorers the explorers
     * @param  {<type>} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: <type>() => any, db: any, configManager: any);
    derivation: string;
    feePerByte: any;
    coefficient: any;
    networkName: string;
    /**
     * Adds an input.
     *
     * @param {TransactionBuilder} txBuilder The transmit builder
     * @param {String} input The input
     */
    addInput(txBuilder: TransactionBuilder, input: string): Promise<void>;
    /**
     * Signs the input.
     *
     * @param {TransactionBuilder} txBuilder The transmit builder
     * @param {Strint} keyForSign The key for sign
     * @param {Number} index The index
     * @param {String} input The input
     */
    signInput(txBuilder: TransactionBuilder, keyForSign: Strint, index: number, input: string): Promise<void>;
    #private;
}
