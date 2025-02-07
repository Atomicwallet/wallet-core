export default OntMixin;
declare function OntMixin(superclass: any): {
    new (config: any, db: any, configManager: any): {
        [x: string]: any;
        "__#9@#privateKey": any;
        gasLimit: any;
        gasPrice: any;
        loadWallet(seed: any, mnemonic: any): Promise<{
            id: any;
            privateKey: any;
            address: string;
        }>;
        address: string | undefined;
        readonly feeTicker: string;
        /**
         * Calculate fees
         * @return {*|String}
         */
        getFee(): any | string;
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
        signTransaction(transaction: any): Promise<any>;
        createTokenTransaction({ address, amount, asset }: {
            address: any;
            amount: any;
            asset: any;
        }): Promise<string>;
        getPrivateKeyObject(): Promise<import("ontology-ts-sdk/lib/types/crypto").PrivateKey>;
        sendAllToMyself(asset: any): Promise<{
            txid: any;
        }>;
        checkUnbondSendTxAndRefreshBalance(): Promise<{
            balance: any;
            balances: any;
        }>;
        checkRewardAndClaim(): Promise<{
            txid: any;
        }>;
        makeClaim(): Promise<{
            txid: any;
        }>;
        getInfo(): Promise<{
            balance: any;
            balances: any;
        }>;
        balance: any;
        balances: any;
        createClaimTransaction(amount: any): Promise<string>;
        claim(): Promise<{
            txid: any;
        }>;
        setPrivateKey(privateKey: any): void;
        sendTransaction(rawtx: any): Promise<{
            txid: any;
        }>;
    };
    [x: string]: any;
};
