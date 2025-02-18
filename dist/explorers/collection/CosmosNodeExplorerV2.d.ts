export default CosmosNodeExplorerV2;
declare const CosmosNodeExplorerV2_base: {
    new (): {
        [x: string]: any;
        getTransactionsModifiedResponse(tx: any, selfAddress: any, asset?: any): any;
        getTransactionNativeType(tx: any): any;
        getTransactionType(tx: any): any;
    };
    [x: string]: any;
};
declare class CosmosNodeExplorerV2 extends CosmosNodeExplorerV2_base {
    /**
     * Constructs the object.
     *
     */
    constructor(...args: any[]);
    defaultTxLimit: number;
    canPaginate: boolean;
    lastKnownHeight: number;
    getInitParams(): {
        baseURL: any;
        headers: {
            'Cache-Control': string;
            Pragma: string;
            Expires: number;
        };
    };
    getAllowedTickers(): string[];
    request(...args: any[]): Promise<any>;
    getAuth(address: any): Promise<any>;
    getLatestBlockUrl(): string;
    getSendTransactionUrl(): string;
    getSendTransactionParams(rawtx: any): {
        tx_bytes: string;
        mode: string;
    };
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    sendDelegationTransaction(address: any, rawtx: any): Promise<any>;
    getTransaction(selfAddress: any, txid: any): Promise<any>;
    getTransactions({ address, limit, denom }: {
        address: any;
        limit: any;
        denom: any;
    }): Promise<any>;
    getTxValue(selfAddress: any, tx: any): any;
    getAmountFromLogs(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): any;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    getTxHash(tx: any): any;
    getTxMemo(tx: any): any;
    getTxType(tx: any): any;
    getTotalBalance(address: any): Promise<any>;
    getRewardsBalance(address: any): Promise<any>;
    getStakedDelegations(address: any): Promise<any>;
    getUnbondingDelegations(address: any): Promise<any>;
    modifyLatestBlockResponse(response: any): any;
    chainId: any;
    getChainId(): Promise<any>;
    getSignerData(address: any): Promise<{
        sequence: any;
        accountNumber: any;
        chainId: any;
    }>;
    getValidators(address: any): Promise<any>;
    getTxFee(tx: any): any;
    /**
     * Gets gas estimation
     * @param rawtx
     * @returns {Promise<string>} - Number in string
     */
    getGasEstimation(rawtx: any): Promise<string>;
}
