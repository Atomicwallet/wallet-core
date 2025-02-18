type IdStruct = {
    ticker: string;
    chainId: number;
    walletType: string;
};
export declare function generateId({ ticker, chainId, walletType }: IdStruct): string;
export {};
