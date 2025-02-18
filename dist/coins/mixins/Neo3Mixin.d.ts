export default Neo3Mixin;
declare function Neo3Mixin(superclass: any): {
    new (): {
        [x: string]: any;
        createTransaction({ address, amount, asset }: {
            address: any;
            amount: any;
            asset?: any;
        }): Promise<any>;
        /**
         * @param rawTx
         * @returns {Promise<{txid}>}
         */
        sendTransaction(tx: any): Promise<{
            txid: any;
        }>;
        getInfo(): Promise<{
            balance: any;
            balances: any;
        }>;
        balance: any;
        balances: any;
        getFee({ sendAmount }?: {
            sendAmount?: string | undefined;
        }): Promise<string>;
    };
    [x: string]: any;
};
