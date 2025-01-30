export default BSVCoin;
declare const BSVCoin_base: {
    new (): {
        [x: string]: any;
        "__#15@#privateKey": any;
        getAddress(): string;
        convertToLegacyAddress(address: any): string;
        convertToCashAddress(address: any): string;
        validateAddress(address: string): boolean;
        createTransaction({ address, amount }: {
            address: any;
            amount: any;
        }): Promise<string>;
        setPrivateKey(privateKey: any): void;
    };
    [x: string]: any;
};
/**
 * Class
 *
 * @class BSVCoin
 */
declare class BSVCoin extends BSVCoin_base {
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
}
