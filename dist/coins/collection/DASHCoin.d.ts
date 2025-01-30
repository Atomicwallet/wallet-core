export default DASHCoin;
declare const DASHCoin_base: {
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
 * Class
 *
 * @class DASHCoin
 */
declare class DASHCoin extends DASHCoin_base {
    /**
     * constructs the object.
     *
     * @param  {<type>} alias the alias
     * @param  {<type>} feeData the fee data
     * @param  {array}  explorers the explorers
     * @param  {<type>} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: <type>() => any);
    derivation: string;
    feePerByte: any;
    coefficient: any;
    networkName: string;
}
