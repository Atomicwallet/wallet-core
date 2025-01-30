export default NeoMixin;
declare function NeoMixin(superclass: any): {
    new (): {
        [x: string]: any;
        "__#8@#privateKey": any;
        /**
         * Loads a wallet.
         *
         * @param {String} mnemonic The private key object.
         * @return {Promise<Object>} The private key.
         */
        loadWallet(seed: any, mnemonic: string): Promise<Object>;
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
        /**
         * @param address
         * @param amount
         * @returns {Promise<string>}
         */
        createTransaction({ address, amount, asset }: {
            address: any;
            amount: any;
            asset: any;
        }): Promise<string>;
        /**
         * @param rawTx
         * @returns {Promise<{txid}>}
         */
        sendTransaction(rawTx: any): Promise<{
            txid: any;
        }>;
        getInfo(): Promise<{
            balance: any;
            balances: any;
        }>;
        balance: any;
        balances: any;
        sendAllToMyself(): Promise<{
            txid: any;
        }>;
        /**
         * Claim gas
         * @returns {Promise<void>}
         */
        claim(): Promise<void>;
        waitUntilConfirmed(txid: any): Promise<void>;
        swap({ amount, asset }: {
            amount: any;
            asset?: any;
        }): Promise<{
            txid: any;
        }>;
        /**
         * Sets the private key.
         *
         * @param {String} privateKey The private key WIF
         */
        setPrivateKey(privateKey: string): Promise<void>;
        account: any;
        address: any;
    };
    [x: string]: any;
};
