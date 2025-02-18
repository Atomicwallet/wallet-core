export default CardanoRestExplorer;
declare class CardanoRestExplorer extends Explorer {
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getBalance(address: any): Promise<any>;
    sendTransaction({ rawtx }: {
        rawtx: any;
    }): Promise<{
        txid: object;
    }>;
    /**
     * Gets the utxo.
     *
     * @return {Promise} The utxo.
     */
    getUnspentOutputs(address: any): Promise<any>;
    getTransactions({ address }: {
        address: any;
    }): Promise<import("../Transaction.js").default[]>;
    getInfo(address: any): Promise<{
        balance: any;
        transactions: any;
    }>;
}
import Explorer from '../../explorers/explorer.js';
