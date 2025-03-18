export default DOGECoin;
declare const DOGECoin_base: {
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
 * Class for
 *
 * @class DOGECoin
 */
declare class DOGECoin extends DOGECoin_base {
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
    network: any;
    setFeeData(feeData?: {}): void;
    feePerByte: string | undefined;
    getFee(args: any): Promise<any>;
    /**
     * Update dynamic data set
     *
     * @param {Object} data The data
     */
    updateCoinParamsFromServer(data: Object): void;
}
