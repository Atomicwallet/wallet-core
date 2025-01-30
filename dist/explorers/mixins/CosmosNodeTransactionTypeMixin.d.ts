export default CosmosNodeTransactionTypeMixin;
declare function CosmosNodeTransactionTypeMixin(superclass: any): {
    new (): {
        [x: string]: any;
        getTransactionsModifiedResponse(tx: any, selfAddress: any, asset?: any): any;
        getTransactionNativeType(tx: any): any;
        getTransactionType(tx: any): any;
    };
    [x: string]: any;
};
