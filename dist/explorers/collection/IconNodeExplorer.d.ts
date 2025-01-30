export default IconNodeExplorer;
declare class IconNodeExplorer extends Explorer {
    constructor(...args: any[]);
    service: any;
    sdk: any;
    getInfo(address: any): Promise<{
        balance: any;
    }>;
    sendTransaction(rawtx: any): Promise<{
        txid: any;
    }>;
    call(params: any): Promise<any>;
    getTransactionByHash(hash: any): any;
    getTransactionResult(hash: any): any;
}
import Explorer from '../../explorers/explorer.js';
