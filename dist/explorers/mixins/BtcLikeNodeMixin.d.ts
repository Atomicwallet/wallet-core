export default BtcLikeNodeMixin;
declare function BtcLikeNodeMixin(superclass: any): {
    new (): {
        [x: string]: any;
        getSendTransactionUrl(): any;
        getSendTransactionParams(rawtx: any): {
            method: string;
            params: any[];
        };
        modifySendTransactionResponse(response: any): {
            txid: any;
        };
    };
    [x: string]: any;
};
