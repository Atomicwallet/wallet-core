export default BinanceDex;
/**
 * Binance Explorer
 *
 * @abstract
 * @class {Explorer}
 */
declare class BinanceDex extends Explorer {
    constructor(...args: any[]);
    socket: {} | null;
    getTransactionUrl(txid: any): string;
    getTransactionParams(): {
        format: string;
    };
    getBlockUrl(height: any): string;
    getBlock(heigh: any): Promise<object>;
    getTransactions(address: any, asset?: string): Promise<Transaction[]>;
    getMultisendTransactions(selfAddress: any, txs: any): Promise<any[]>;
    latestBlock: Object | undefined;
    modifyMultisendTransactionResponse(tx: any, selfAddress: any): Promise<Transaction>;
    modifyLatestBlockResponse(response: any): any;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): any;
    getTxConfirmations(tx: any): any;
    getTokenList(userTokenSymbols?: any[]): Promise<any>;
    setSocketClient(address: any): void;
    disconnectSocket(): void;
    connectSocket(address: any): Promise<void>;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
