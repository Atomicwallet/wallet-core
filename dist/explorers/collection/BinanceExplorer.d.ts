export default BinanceExplorer;
declare class BinanceExplorer extends Explorer {
    getBalance(address: any): Promise<any>;
    getAssetTransfers({ address, txArray }: {
        address: any;
        txArray: any;
    }): Promise<{
        transactions: Transaction[];
        multisend: any[];
    }>;
    getTransactions({ address }: {
        address: any;
    }): Promise<never[] | {
        transactions: Transaction[];
        multisend: any[];
    }>;
    modifyTransactionsResponse(txs: any, selfAddress: any): Transaction[];
    getTxType({ txType }: {
        txType?: undefined;
    }): any;
    getTxAssetId(asset: any): any;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): any;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): any;
    getTxConfirmations(tx: any): any;
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
