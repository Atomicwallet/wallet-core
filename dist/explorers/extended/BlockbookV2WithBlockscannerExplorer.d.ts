declare const BlockbookV2WithBlockscannerExplorer_base: {
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
declare class BlockbookV2WithBlockscannerExplorer extends BlockbookV2WithBlockscannerExplorer_base {
}
export default BlockbookV2WithBlockscannerExplorer;
