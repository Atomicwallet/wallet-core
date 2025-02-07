export default ZECCoin;
declare const ZECCoin_base: {
    new (): {
        [x: string]: any;
        "__#10@#privateKey": any;
        loadWallet(seed: any): Promise<Object>;
        address: any;
        getNetwork(): Promise<any>;
        getAddress(privateKey?: any): string;
        validateAddress(address: string): boolean;
        getTransactionBuilder(): Promise<any>;
        addInput(txBuilder: any, input: any): void;
        signInput(txBuilder: any, keyForSign: any, index: any, input: any): void;
        createClaimTransaction(privateKey: string): Promise<string>;
        createTransaction({ address, amount }: string): Promise<string>;
        buildTx(inputs: any, address: any, amount: any, change: any, privateKey: any, otherSideAddr?: undefined): Promise<any>;
        signTransaction(txBuilder: any, inputs: any, privateKey: any): Promise<any>;
        getKeyForSignFromPrivateKey(privateKey?: any): Promise<any>;
        getScriptPubKey(): Promise<any>;
        setPrivateKey(privateKey: any): void;
    };
    [x: string]: any;
};
/**
 * Class
 *
 * @class ZECCoin
 */
declare class ZECCoin extends ZECCoin_base {
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
    transactions: any[];
    loadCoreLibrary(): any;
    getBranchId(): Promise<any>;
    setBranchId(id: any): Promise<void>;
    signInput(txBuilder: any, keyForSign: any, index: any, input: any): Promise<any>;
    updateCoinParamsFromServer(data: any): void;
    branchId: any;
}
