export default HashnodeExplorer;
/**
 * mainnet address book
 * https://docs.hedera.com/docs/mainnet
 */
declare class HashnodeExplorer extends Explorer {
    constructor(...args: any[]);
    node: {
        [x: number]: any;
    };
    getInfo(address: any): Promise<{
        balance: any;
    }>;
    sendTransaction({ rawtx, account, privateKey }: {
        rawtx: any;
        account: any;
        privateKey: any;
    }): Promise<{
        txid: string;
    }>;
}
import Explorer from '../../explorers/explorer.js';
