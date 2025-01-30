export default OntExplorer;
declare class OntExplorer extends Explorer {
    constructor(...args: any[]);
    rest: RestClient;
    modifyGeneralResponse(response: any): any;
    getTransactionsUrl(address: any): string;
    getTokenTransactionsUrl(address: any, asset?: string): string;
    /**
     * Gets the transactions.
     *
     * @param  {Number} offset The offset (default: 0)
     * @param  {Number} limit The limit (default: this.defaultTxLimit)
     * @return {Promise} The transactions.
     */
    getTransactions({ address, offset, limit }: number): Promise<any>;
    latestBlock: Object | undefined;
    getTokenTransactions({ address, offset, limit, asset }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
        asset?: string | undefined;
    }): Promise<any>;
    modifyTransactionsResponse(response: any, address: any, asset?: string): Transaction[];
    modifyTokenTransactionsResponse(filteredAssetTxs: any, address: any, asset: any): any;
    modifyLatestBlockResponse([response]: [any]): any;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    sendTransaction(rawtx: any): Promise<{
        txid: any;
    }>;
    getTxFee(tx: any): any;
    getTxFeeTicker(): string;
}
import Explorer from '../../explorers/explorer.js';
import { RestClient } from 'ontology-ts-sdk';
import Transaction from '../../explorers/Transaction.js';
