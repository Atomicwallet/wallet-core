export default class HederaMirrorNodeExplorer extends Explorer {
    getTransactionUrl(address: any): string;
    getTransactionsUrl(): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {
        'account.id': any;
        limit: any;
    };
    getTxValue(selfAddress: any, tx: any): string;
    getTxDateTime(tx: any): Date;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxHash(tx: any): any;
    getTxMemo(tx: any): any;
    getTxConfirmations(): number;
    /**
     * @param {object} tx
     * @param {RawTxType} tx.name
     * @returns {string}
     */
    getTxType(tx: {
        name: RawTxType;
    }): string;
    getTxFee(tx: any): string;
    getTxOtherSideAddress(selfAddress: any, tx: any): string;
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    modifyTransactionResponse(response: any, selfAddress: any, asset?: any): import("../Transaction.js").default;
    modifyTransactionsResponse(response: any, selfAddress: any): import("../Transaction.js").default[];
    #private;
}
export type Transfer = {
    account: string;
    amount: number;
};
export type RawTxType = "CONSENSUSCREATETOPIC" | "CONSENSUSDELETETOPIC" | "CONSENSUSSUBMITMESSAGE" | "CONSENSUSUPDATETOPIC" | "CONTRACTCALL" | "CONTRACTCREATEINSTANCE" | "CONTRACTDELETEINSTANCE" | "CONTRACTUPDATEINSTANCE" | "CRYPTOADDLIVEHASH" | "CRYPTOAPPROVEALLOWANCE" | "CRYPTOCREATEACCOUNT" | "CRYPTODELETE" | "CRYPTODELETEALLOWANCE" | "CRYPTODELETELIVEHASH" | "CRYPTOTRANSFER" | "CRYPTOUPDATEACCOUNT" | "ETHEREUMTRANSACTION" | "FILEAPPEND" | "FILECREATE" | "FILEDELETE" | "FILEUPDATE" | "FREEZE" | "NODESTAKEUPDATE" | "SCHEDULECREATE" | "SCHEDULEDELETE" | "SCHEDULESIGN" | "SYSTEMDELETE" | "SYSTEMUNDELETE" | "TOKENASSOCIATE" | "TOKENBURN" | "TOKENCREATION" | "TOKENDELETION" | "TOKENDISSOCIATE" | "TOKENFEESCHEDULEUPDATE" | "TOKENFREEZE" | "TOKENGRANTKYC" | "TOKENMINT" | "TOKENPAUSE" | "TOKENREVOKEKYC" | "TOKENUNFREEZE" | "TOKENUNPAUSE" | "TOKENUPDATE" | "TOKENWIPE" | "UNCHECKEDSUBMIT" | "UNKNOWN" | "UTILPRNG";
import Explorer from '../../explorers/explorer.js';
