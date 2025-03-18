export default HasBlockscannerMixin;
declare function HasBlockscannerMixin(superclass: any): {
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
