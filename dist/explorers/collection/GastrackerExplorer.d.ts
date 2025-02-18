export default GastrackerExplorer;
/**
 * ETC Explorer
 *
 * @abstract
 * @class {Explorer}
 */
declare class GastrackerExplorer extends Explorer {
    getTransactions(address: any): Promise<import("../Transaction.js").default[]>;
    getInfo(address: any): Promise<{
        balance: any;
        transactions: never[];
    }>;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
