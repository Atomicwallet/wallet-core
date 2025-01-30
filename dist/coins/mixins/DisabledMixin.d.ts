export default DisabledMixin;
declare function DisabledMixin(superclass: any): {
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
