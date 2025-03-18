export default BlockbookExplorer;
declare class BlockbookExplorer extends Explorer {
    constructor(args: any);
    version: any;
    getWalletAddress(): any;
    getAddressUrl(address: any): string;
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    modifyTransactionsResponse(response: any, selfAddress: any): import("../Transaction.js").default[];
    modifyUnspentOutputsResponse(response: any): any;
    modifyUnspentAddress(address: any): any;
    getTransactionsParams(address: any, offset: any, limit: any): {};
    sendTransaction(rawtx: any): Promise<any>;
    /**
     * Calculates the balance.
     *
     * @param {Object[]} utxos The utxos
     * @return {BN} The balance.
     */
    calculateBalance(utxos?: Object[]): BN;
}
import Explorer from '../../explorers/explorer.js';
