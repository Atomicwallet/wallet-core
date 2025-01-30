export const NODE_PROVIDER_OPERATION: "node";
export const BALANCE_PROVIDER_OPERATION: "balance";
export const HISTORY_PROVIDER_OPERATION: "history";
export const TOKEN_PROVIDER_OPERATION: "token";
export const TOKEN_HISTORY_PROVIDER_OPERATION: "token-history";
export const SEND_PROVIDER_OPERATION: "send";
export const NFT_SEND_PROVIDER_OPERATION: "nft-send";
export const SOCKET_PROVIDER_OPERATION: "socket";
export const TONWEB_PROVIDER_OPERATION: "tonweb";
export default HasProviders;
declare function HasProviders(superclass: any): {
    new (): {
        [x: string]: any;
        processExplorerConfig(config: any): any;
        defaultProvider: any;
        providersMap: {} | undefined;
        getProvider(name: any): any;
        getBalance(): Promise<any>;
        getTransactions(args: any): Promise<any>;
        /**
         * Gets the information about a wallet.
         *
         * @return {Promise<Object>} The information data.
         */
        getInfo(): Promise<Object>;
        balance: any;
        getUnspentOutputs(address: any, scriptPubKey: any): Promise<any>;
        getUTXO(): any;
        sendTransaction(rawtx: any): any;
        getTransaction(txid: any): any;
        /**
         * Update dynamic data set
         *
         * @param {Object} config Server coin data
         */
        updateCoinParamsFromServer(config: Object): boolean;
        chainId: any;
        fee: any;
        stakingContract: any;
        stakingProxyContract: any;
        stakingFeeGas: any;
        reStakingFeeGas: any;
        unstakingFeeGas: any;
        claimFeeGas: any;
        tokenFeeGas: any;
        sendFeeGas: any;
    };
    [x: string]: any;
};
