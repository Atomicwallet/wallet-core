export default TezosNodeExplorer;
declare class TezosNodeExplorer extends Explorer {
    getDelegate(address: any): Promise<object>;
    /**
     * Tezos node explore has no native fetch operation by hash query
     * so we used this for socket only, which returns complete suited operation as { hash: tx<{}>}
     * @param selfAddress
     * @param tx Operation object
     * @returns {{}}
     */
    getTransaction(selfAddress: any, tx: any): {};
    isValidator(address: any): Promise<boolean>;
    modifyInfoResponse(response: any): {
        balance: any;
    };
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxConfirmations(tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxValue(address: any, tx: any): any;
    getTxHash(tx: any): any;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
