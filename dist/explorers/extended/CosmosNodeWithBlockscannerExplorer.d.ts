declare const CosmosNodeWithBlockscannerExplorer_base: {
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
declare class CosmosNodeWithBlockscannerExplorer extends CosmosNodeWithBlockscannerExplorer_base {
}
export default CosmosNodeWithBlockscannerExplorer;
