export default HasBlockScanner;
declare function HasBlockScanner(superclass: any): {
    new (): {
        [x: string]: any;
        /**
         * Notifies the client on tx received from socket
         *
         * @param {Object} tx the tx data
         */
        onConfirmSocketTx(tx: Object): void;
    };
    [x: string]: any;
};
