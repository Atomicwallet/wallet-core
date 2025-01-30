export default BitcoinLikeFeeMixin;
declare function BitcoinLikeFeeMixin(superclass: any): {
    new (): {
        [x: string]: any;
        /**
         * @param {Number} amount In satoshis
         * @param isSendAll
         * @return {Promise<BN>}
         */
        getFee({ utxos, feePerByte }?: number): Promise<BN>;
        getMultiplier(): any;
        getFeePerByte(): any;
        /**
         * Calculates the balance.
         *
         * @param {Object[]} utxos The utxos
         * @return {BN} The balance.
         */
        calculateBalance(utxos?: Object[]): BN;
    };
    [x: string]: any;
};
