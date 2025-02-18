export default PolkadotNodeExplorer;
declare class PolkadotNodeExplorer extends Explorer {
    constructor(...args: any[]);
    endpoint: any;
    loadEndpoint(): Promise<boolean>;
    getInfo(address: any): Promise<{
        balance?: undefined;
        balances?: undefined;
        transactions?: undefined;
        nonce?: undefined;
    } | {
        balance: any;
        balances: {
            available: any;
            free: any;
            frozen: any;
        };
        transactions: any;
        nonce: any;
    }>;
    sendTransaction({ rawtx, privateKey }: {
        rawtx: any;
        privateKey: any;
    }): Promise<{
        txid: any;
    }>;
    sendDelegationTransaction({ rawtx, privateKey }: {
        rawtx: any;
        privateKey: any;
    }): Promise<any>;
    sendUnDelegationTransaction({ rawtx, privateKey }: {
        rawtx: any;
        privateKey: any;
    }): Promise<{
        txid: any;
    }>;
}
import Explorer from '../../explorers/explorer.js';
