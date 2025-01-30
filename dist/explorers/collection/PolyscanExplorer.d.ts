export default PolyscanExplorer;
/**
 * Class for explorer.
 *
 * @class {PolyscanExplorer}
 */
declare class PolyscanExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    });
    modifyGeneralResponse(response: any): any;
    /**
     * @override
     */
    override getTransactionsUrl(address: any): string;
    /**
     * @override
     */
    override getTransactionsParams(address: any): {
        module: string;
        action: string;
        address: any;
        startblock: number;
        endblock: number;
        sort: string;
        apikey: string;
    };
    /**
     * @override
     */
    override getBalance(address: any): Promise<any>;
    modifyTransactionsResponse(response: any, address: any): Transaction[];
    getTransactionsModifiedResponse(...args: any[]): Transaction;
    /**
     * @override
     */
    override getTxHash(tx: any): any;
    /**
     * @override
     */
    override getTxDateTime(tx: any): Date;
    /**
     * @override
     */
    override getTxFee(tx: any): any;
    /**
     * @override
     */
    override getTxConfirmations(tx: any): number;
    /**
     * Gets the trasaction direction.
     * @override
     * @param {Transaction} tx The trasaction
     * @return {Boolean} The trasaction direction.
     */
    override getTxDirection(selfAddress: any, tx: Transaction): boolean;
    /**
     * @param tx
     * @return {string}
     * @override
     */
    override getTxOtherSideAddress(selfAddress: any, tx: any): string;
    /**
     * @param tx
     * @return {string}
     * @override
     */
    override getTxValue(selfAddress: any, tx: any): string;
    getTokenTransactions({ address }: {
        address: any;
    }): Promise<any>;
    getTokenTxAmount(tx: any): string;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
