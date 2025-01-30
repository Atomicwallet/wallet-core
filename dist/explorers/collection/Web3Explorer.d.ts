export default Web3Explorer;
/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
declare class Web3Explorer extends Explorer {
    constructor(...args: any[]);
    requestId: number;
    getInfo(address: any, coinOnly?: boolean): Promise<{
        balance: any;
        transactions: never[];
    }>;
    getTokensInfo(tokens: any, address: any): Promise<any>;
    getTransaction(address: any, txId: any, tokens: any): Promise<Transaction | null>;
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
    }): Promise<never[]>;
    sendTransaction(rawtx: any): Promise<any>;
    getGasPrice(): Promise<{
        node: any;
    }>;
    getGasPriceConfig(): null;
    getGasLimit(): Promise<any>;
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxNonce(tx: any): any;
    getTxConfirmations(tx: any): number;
    /**
     * Gets the trasaction direction.
     *
     * @param {Transaction} tx The trasaction
     * @return {String} The trasaction direction.
     */
    getTxDirection(selfAddress: any, tx: Transaction): string;
    /**
     * @param tx
     * @return {string}
     */
    getTxOtherSideAddress(selfAddress: any, tx: any): string;
    /**
     * @param tx
     * @return {string}
     */
    getTxValue(selfAddress: any, tx: any, wallet?: any): string;
    /**
     * get token balance by contract address
     * @param contractAddress
     * @return {Promise<any>}
     */
    getTokenBalanceByContractAddress({ address, contractAddress }: {
        address: any;
        contractAddress: any;
    }): Promise<any>;
    getTokenBalanceOfCall({ address, contractAddress }: {
        address: any;
        contractAddress: any;
    }, callback: any): any;
    createSendTokenContract(contractAddress: any, addressFrom: any, addressTo: any, amount: any): any;
    /**
     * @param {string} input
     * @return {Object|null}
     */
    decodeInput(input: string): Object | null;
    /**
     * @return {Object[]}
     */
    getERC20ABI(): Object[];
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
