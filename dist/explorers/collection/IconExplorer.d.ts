export default IconExplorer;
declare class IconExplorer extends Explorer {
    getInfoParams(address: any): {
        address: any;
    };
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number): {
        address: any;
        page: number;
        count: any;
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
    }): Promise<import("../Transaction.js").default[]>;
    latestBlock: Object | undefined;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime({ createDate }: {
        createDate?: string | undefined;
    }): Date;
    getTxConfirmations(tx: any): number;
    getLatestBlockParams(): {
        count: number;
    };
    modifyLatestBlockResponse(response: any): any;
    getSendTransactionUrl(): void;
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
