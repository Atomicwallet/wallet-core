export default AdaAtomicExplorer;
declare class AdaAtomicExplorer extends Explorer {
    getInfoParams(address: any): {
        address: any;
    };
    getAccountStateUrl(): string;
    getTransactionUrl(): string;
    getTransactionParams(txid: any): {
        txid: any;
    };
    getTransactionsUrl(): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {
        address: any;
        limit: any;
    };
    getUnspentOutputsUrl(): string;
    getUnspentOutputsParams(address: any): {
        address: any;
    };
    getSendTransactionParams(rawtx: any): {
        tx: string;
        network: string;
    };
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValueSatoshis(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getBalance(address: any): Promise<any>;
    getAccountState(address: any): Promise<void | object>;
    modifyInfoResponse(response: any): {
        balance: any;
    };
    modifyUnspentOutputsResponse(address: any, response: any): any;
    modifySendTransactionResponse(response: any, txid: any): {
        txid: any;
    };
    sendTransaction({ rawtx, txid }: {
        rawtx: any;
        txid: any;
    }): Promise<{
        txid: any;
    }>;
    getTxFee(): null;
    getTxConfirmations(): number;
}
import Explorer from '../../explorers/explorer.js';
