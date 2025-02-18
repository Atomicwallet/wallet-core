export default NemNodeExplorer;
declare class NemNodeExplorer extends Explorer {
    constructor(...args: any[]);
    endpoint: any;
    getWalletAddress(): any;
    updateEndpoint(baseUrl: any): void;
    getInfo(address: any): Promise<{
        balance: any;
        transactions: any;
    }>;
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: any;
    };
    getTransaction(txId: any): Promise<import("../Transaction.js").default>;
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
    }): Promise<import("../Transaction.js").default[]>;
    latestBlock: any;
    getLatestBlock(): Promise<any>;
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): string;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxConfirmations(tx: any): number;
    sendTransaction(rawtx: any): Promise<{
        txid: any;
    }>;
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
