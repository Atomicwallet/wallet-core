export default VetNodeExplorer;
declare class VetNodeExplorer extends Explorer {
    getInfoOptions(): string;
    normalizeBalance(responseValue: any): string;
    modifyInfoResponse(response: any): {
        balance: string;
        energy: string;
    };
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
    }): Promise<Transaction[]>;
    latestBlock: Object | undefined;
    getTransfersParams(address: any, offset?: number, limit?: any): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): string;
    getTransactionUrl(txId: any): string;
    getTransactionParams(txId: any): {
        txId: any;
        raw: boolean;
    };
    getTransactionsUrl(address: any): string;
    getTransfersUrl(): string;
    modifyTransactionResponse(tx: any, selfAddress: any, asset?: any): any;
    modifyTransactionsResponse(response: any, address: any): any[];
    modifyTransfersResponse(response: any, address: any, asset?: string): any[];
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, sender: any): boolean;
    getTxOtherSideAddress(selfAddress: any, from: any, to: any): any;
    getTxValue(selfAddress: any, amount: any): any;
    getTxDateTime(timestamp: any): Date;
    getTxConfirmations(block: any): number;
    getSendTransactionParams(rawtx: any): {
        raw: any;
    };
    sendTransaction(rawtx: any): Promise<{
        txid: string;
    }>;
    /**
     * @param response
     * @returns {{txid: string}}
     */
    modifySendTransactionResponse(response: any): {
        txid: string;
    };
    addLeadingZeros(value: any): any;
    removeLeadingZero(value: any): string;
    getTxFee(): any;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
