export default class ThetaExplorer extends Explorer {
    constructor(...args: any[]);
    defaultTxLimit: number;
    /**
     * Gets the txs
     *
     * @param  {Object} options the request options
     * @return {Object[]} the txs
     * @throws {Error}
     */
    getTransactions(options: Object): Object[];
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: any, limit?: number, pageNum?: number): {
        pageNumber: number;
        limitNumber: number;
    };
    modifyTransactionsResponse(response: any, selfAddress: any): Promise<any[]>;
    getTransactionsModifiedResponse(tx: any, selfAddress: any, currentBlock: any): never[] | [string, any];
    getTxHash(tx: any): any;
    getTxConfirmations(tx: any, currentBlock?: number): any;
    getTxDateTime(tx: any): Date;
    getTxFee(tx: any): any;
    getTxFeeTicker(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
