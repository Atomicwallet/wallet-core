export default ElrondApiExplorer;
declare class ElrondApiExplorer extends Explorer {
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: number | undefined, limit: any, pageNum: any): {
        from: number;
        to: any;
        withScResults: boolean;
    };
    getTransfersrUrl(address: any): string;
    getStakingInfoUrl(address: any): string;
    getSendTransactionParams(rawtx: any): any;
    getTransactionUrl(txid: any): string;
    modifyInfoResponse(response: any): {
        balance: any;
        nonce: any;
    };
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    modifyTransactionsResponse(txs: any, selfAddress: any): Transaction[];
    getTransactionType(tx: any): any;
    getTxConfirmations(tx: any): any;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getValueFromSmartContractResults(selfAddress: any, { results }?: {
        results?: never[] | undefined;
    }): any;
    getTxNonce(tx: any): any;
    getTxDateTime(tx: any): Date;
    fetchStakingInfo(address: any): Promise<{
        staked: Amount;
        unstaking: Amount;
        pendingWithdrawals: Amount;
        availableWithdrawals: Amount;
        rewards: Amount;
        validators: any;
    }>;
    modifyFetchStakingInfo(response: any): {
        staked: Amount;
        unstaking: Amount;
        pendingWithdrawals: Amount;
        availableWithdrawals: Amount;
        rewards: Amount;
        validators: any;
    };
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
import { Amount } from '../../utils/index.js';
