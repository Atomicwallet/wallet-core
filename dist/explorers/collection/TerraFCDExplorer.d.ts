export default class TerraFCDExplorer extends Explorer {
    constructor(...args: any[]);
    network: string;
    getGasPrices(): Promise<object>;
    getTransactionsUrl(): string;
    getTransactionsParams(address: any, offset: any, limit: any): {
        account: any;
        offset: any;
        limit: any;
    };
    modifyLatestBlockResponse(response: any): any;
    getTxDenom(tx: any): any;
    getTxCoins(selfAddress: any, tx: any): any;
    modifyTransactionsResponse(response: any, address: any): any;
    getTxType(tx: any): any;
    getTxConfirmations(): number;
    getTxDateTime(tx: any): Date;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxFee(tx: any): any;
    getTxMemo(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
