export default BitcoinJSMixin;
declare function BitcoinJSMixin(superclass: any): {
    new (): {
        [x: string]: any;
        "__#14@#privateKey": any;
        /**
         * Loads a wallet.
         *
         * @param {BitcoreMnemonic} mnemonic The private key object.
         * @return {Promise<Object>} The private key.
         */
        loadWallet(seed: any): Promise<Object>;
        address: string | undefined;
        getNetwork(): Promise<any>;
        /**
         * The address getter
         *
         * @return {String}
         */
        getAddress(privateKey?: any): string;
        getAddressFromPublicKey(publicKey: any): Promise<any>;
        /**
         * Validates wallet address
         *
         * @param {String} address The address
         * @return {Boolean}
         */
        validateAddress(address: string): boolean;
        getTransactionBuilder(): Promise<any>;
        addInput(txBuilder: any, input: any): void;
        signInput(txBuilder: any, keyForSign: any, index: any, input: any): void;
        /**
         * Creates a claim transaction.
         *
         * @param {String} privateKey PrivateKey for claim
         * @return {Promise<String>} Raw transaction
         */
        createClaimTransaction(privateKey: string): Promise<string>;
        /**
         * Creates a transaction.
         *
         * @param {String} address The destination address
         * @param {Number} amount The amount to send
         * @param {String} privateKey PrivateKey for claim from forked
         * @return {Promise<String>} Raw transaction
         */
        createTransaction({ address, amount }: string): Promise<string>;
        buildTx(inputs: any, address: any, amount: any, change: any, privateKey: any, otherSideAddr: undefined, version: any): Promise<any>;
        getKeyForSignFromPrivateKey(privateKey?: any): Promise<any>;
        getScriptPubKey(): Promise<any>;
        setPrivateKey(privateKey: any): void;
    };
    [x: string]: any;
};
