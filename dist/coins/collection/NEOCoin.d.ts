export default NEOCoin;
declare const NEOCoin_base: {
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
 * class for NEO coin
 *
 * @class NEOCoin
 */
declare class NEOCoin extends NEOCoin_base {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        id: any;
    }, db: any, configManager: any);
    derivation: string;
    balances: any;
    get feeTicker(): string;
}
