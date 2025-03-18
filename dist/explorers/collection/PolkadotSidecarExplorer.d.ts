export default PolkadotSidecarExplorer;
declare class PolkadotSidecarExplorer extends Explorer {
    getTxMetaUrl(): string;
    getTxMetaMethod(): string;
    getTxMetaParams(): {
        noMeta: boolean;
    };
    getMetadataUrl(): string;
    getMetadataMethod(): string;
    getMetadata(): Promise<object>;
    getTxMeta(): Promise<object>;
    sendTransaction({ rawtx }: {
        rawtx: any;
    }): Promise<Object>;
    modifyInfoResponse(response: any): {
        balance?: undefined;
        balances?: undefined;
        nonce?: undefined;
    } | {
        balance: any;
        balances: {
            available: any;
            free: any;
            frozen: any;
        };
        nonce: any;
    };
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
}
import Explorer from '../../explorers/explorer.js';
