export default CosmosNodeExplorer;
declare const CosmosNodeExplorer_base: {
    new (): {
        [x: string]: any;
        getTransactionsModifiedResponse(tx: any, selfAddress: any, asset?: any): any;
        getTransactionNativeType(tx: any): any;
        getTransactionType(tx: any): any;
    };
    [x: string]: any;
};
declare class CosmosNodeExplorer extends CosmosNodeExplorer_base {
    /**
     * Constructs the object.
     *
     * @param {Coin|Token} wallet The wallet
     * @param {String} baseUrl The base url
     * @param {String} webUrl The web url
     */
    constructor(...args: any[]);
    defaultTxLimit: number;
    canPaginate: boolean;
    lastKnownHeight: number;
    validatorMoniker: {};
    getAllowedTickers(): string[];
    request(...args: any[]): Promise<any>;
    getAuth(address: any): Promise<any>;
    getLatestBlockUrl(): string;
    getSendTransactionUrl(): string;
    getSendTransactionParams(rawtx: any): any;
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    sendDelegationTransaction(address: any, rawtx: any): Promise<any>;
    getTransactionRewardsBlueprint({ from, gas, gas_adjustment, fee, chain_id, denom }: {
        from: any;
        gas: any;
        gas_adjustment?: string | undefined;
        fee: any;
        chain_id: any;
        denom?: string | undefined;
    }): Promise<any>;
    getTransaction(selfAddress: any, txid: any): Promise<any>;
    getTransactions({ address, limit, pageNum }: {
        address: any;
        limit: any;
        pageNum: any;
    }): Promise<any>;
    getTxValue(selfAddress: any, tx: any): any;
    /**
     * Gets the transaction direction.
     *
     * @param {Object} tx The transaction
     * @return {Boolean} The transaction direction.
     */
    getTxDirection(selfAddress: any, tx: Object): boolean;
    /**
     * Gets the transaction recipient.
     *
     * @param {Object} tx The transaction response.
     * @return {(Boolean|String)} The transaction recipient.
     */
    getTxOtherSideAddress(selfAddress: any, tx: Object): (boolean | string);
    /**
     * Gets the transaction datetime.
     *
     * @param {Object} tx The transaction response
     * @return {Date} The transaction datetime.
     */
    getTxDateTime(tx: Object): Date;
    /**
     * Gets the transaction confirmations.
     *
     * @param {Object} tx The transaction response.
     * @return {Number} The transaction confirmations.
     */
    getTxConfirmations(tx: Object): number;
    /**
     * Gets the transaction hash.
     *
     * @param {Object} tx The transaction response.
     * @return {String} The transaction hash.
     */
    getTxHash(tx: Object): string;
    /**
     * Gets the transaction memo/payment-id.
     *
     * @param {Object} tx The transaction response
     */
    getTxMemo(tx: Object): any;
    getTotalDelegations(delegations: any, staking: any): any;
    getTotalDelegationsBand(delegations: any, staking: any): any;
    getTotalDelegationsAtom(delegations: any, staking: any): any;
    getInfo(address: any): Promise<{
        balance: any;
        balances: {
            available: any;
            total: any;
            staking: {
                validators: {};
                total: any;
            };
            rewards: any;
            unbonding: {
                validators: {};
                total: any;
            };
            availableForStake: any;
        };
        transactions: any;
    }>;
    modifyLatestBlockResponse(response: any): any;
    chainId: any;
    getChainId(): any;
    getTxFee(tx: any): any;
}
