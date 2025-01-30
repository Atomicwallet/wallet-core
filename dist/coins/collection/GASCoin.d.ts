export default GASCoin;
declare const GASCoin_base: {
    new (...args: any[]): {
        [x: string]: any;
        isDisabled: boolean;
        getBalance(): Promise<string>;
        getTransactions(): Promise<never[]>;
        getInfo(): Promise<{
            balance: string;
        }>;
        balance: string | undefined;
        getUnspentOutputs(): never[];
        getUTXO(): never[];
        sendTransaction(): null;
        getTransaction(): null;
        updateCoinParamsFromServer(): undefined;
    };
    [x: string]: any;
};
/**
 * class for GAS coin
 *
 * @class GASCoin
 */
declare class GASCoin extends GASCoin_base {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        id: any;
    });
    derivation: string;
}
