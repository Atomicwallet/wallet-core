export default BlockcypherExplorer;
declare class BlockcypherExplorer extends Explorer {
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): any;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
