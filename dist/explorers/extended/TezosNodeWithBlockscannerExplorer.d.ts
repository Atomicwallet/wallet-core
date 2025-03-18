declare const TezosNodeWithBlockscannerExplorer_base: {
    new (): {
        [x: string]: any;
        getSocketTransaction({ address, hash, tokens, type, scriptPubKey }: {
            address: any;
            hash: any;
            tokens: any;
            type: any;
            scriptPubKey: any;
        }): Promise<void>;
    };
    [x: string]: any;
};
declare class TezosNodeWithBlockscannerExplorer extends TezosNodeWithBlockscannerExplorer_base {
}
export default TezosNodeWithBlockscannerExplorer;
