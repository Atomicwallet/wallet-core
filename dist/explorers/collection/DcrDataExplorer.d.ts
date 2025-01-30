export default DcrDataExplorer;
declare class DcrDataExplorer extends Explorer {
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any, offset: any, limit: any): string;
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
    }): Promise<import("../Transaction.js").default[]>;
}
import Explorer from '../../explorers/explorer.js';
