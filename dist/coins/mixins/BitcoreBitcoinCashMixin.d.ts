export default BitcoreBitcoinCashMixin;
declare function BitcoreBitcoinCashMixin(superclass: any): {
    new (): {
        [x: string]: any;
        "__#15@#privateKey": any;
        /**
         * The address getter
         *
         * @return {String}
         */
        getAddress(): string;
        /**
         * Convert cash address to legacy
         *
         * @return {String}
         */
        convertToLegacyAddress(address: any): string;
        /**
         * Convert legacy address to cash
         *
         * @return {String}
         */
        convertToCashAddress(address: any): string;
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
         * @return {Promise<string>}
         */
        createTransaction({ address, amount }: {
            address: any;
            amount: any;
        }): Promise<string>;
        setPrivateKey(privateKey: any): void;
    };
    [x: string]: any;
};
