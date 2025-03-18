export default YoroExplorer;
declare class YoroExplorer extends Explorer {
    constructor(...args: any[]);
    lastTx: any;
    updating: boolean;
    txs: any[];
    lastDelegationCert: any;
    getInfo(address: any): Promise<{
        balance: BN;
        transactions: any;
    }>;
    /**
     * Get a transactions list for a wallet
     *
     * @return {Promise<Object[]>}
     */
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
    }): Promise<Object[]>;
    getTransactionsQueued({ blockHash, address, recursion, after }: {
        blockHash: any;
        address: any;
        recursion?: boolean | undefined;
        after?: undefined;
    }): any;
    lastUpdatedTx: boolean | undefined;
    getTransactionsUrl(address: any): string;
    getUnspentOutputsUrl(): string;
    getUTXOUrl(): string;
    getRegistrationHistoryUrl(): string;
    getTxUrl(txId: any): string;
    getAccountStateUrl(): string;
    getInfoOptions(): {
        headers: {
            'tangata-manu': string;
        };
    };
    getBroadcastUrl(): any;
    getTransactionsParams(address: any, untilBlock: any, after?: undefined): {
        addresses: any[];
        untilBlock: any;
        after: undefined;
    };
    modifyTransactionsResponse(txs: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    /**
     * Gets the balance
     *
     * @returns {Promise<BN>}
     */
    getBalance(address: any): Promise<BN>;
    getUnspentOutputs(address: any): Promise<Object[]>;
    /**
     * @param {string} address
     * @returns {Promise<Object[]>}
     */
    getUTXO(address: string): Promise<Object[]>;
    /**
     * @param {object} transaction
     * @returns {Promise<string>}
     */
    sendTransaction({ rawtx, txid }: object): Promise<string>;
    getTxSummary(txId: any): Promise<object>;
    getTxsSummary(txsIds: any): Promise<object[]>;
    getRegistrationHistory(stakeAddressHex: any): Promise<object>;
    getAccountState(stakeAddressHex: any): Promise<object>;
}
import Explorer from '../../explorers/explorer.js';
