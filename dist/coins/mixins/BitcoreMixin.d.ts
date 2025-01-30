export default BitcoreMixin;
declare function BitcoreMixin(superclass: any): {
    new (): {
        [x: string]: any;
        "__#13@#privateKey": any;
        /**
         * Loads a wallet.
         *
         * @param {String} seed The private key seed.
         * @return {Promise<Coin>} Self.
         */
        loadWallet(seed: string): Promise<Coin>;
        address: string | undefined;
        getNetwork(): Promise<any>;
        getDeriveFunctionName(): string;
        /**
         * The address getter
         *
         * @return {String}
         */
        getAddress(): string;
        /**
         * Validates wallet address
         *
         * @param {String} address The address
         * @return {Boolean}
         */
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
