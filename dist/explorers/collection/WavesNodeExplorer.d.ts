export default WavesNodeExplorer;
/**
 * WavesNodeExplorer
 *
 * https://docs.wavesplatform.com/en/waves-api-and-sdk/waves-node-rest-api.html
 */
declare class WavesNodeExplorer extends Explorer {
    getWalletAddress(): any;
    getInfoOptions(): {
        transformResponse: ((data: any) => any)[];
    };
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: any;
    };
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
    }): Promise<import("../Transaction.js").default[]>;
    latestBlock: Object | undefined;
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxConfirmations(tx: any): number;
    getSendTransactionParams(rawtx: any): any;
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
