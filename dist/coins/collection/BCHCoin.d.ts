export default BCHCoin;
declare const BCHCoin_base: {
    new (): {
        [x: string]: any;
        processExplorerConfig(config: any): any;
        defaultProvider: any;
        providersMap: {} | undefined;
        getProvider(name: any): any;
        getBalance(): Promise<any>;
        getTransactions(args: any): Promise<any>;
        getInfo(): Promise<Object>;
        balance: any;
        getUnspentOutputs(address: any, scriptPubKey: any): Promise<any>;
        getUTXO(): any;
        sendTransaction(rawtx: any): any;
        getTransaction(txid: any): any;
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
/**
 * Class
 *
 * @class BCHCoin
 */
declare class BCHCoin extends BCHCoin_base {
    /**
     * constructs the object.
     *
     * @param  {<type>} alias the alias
     * @param  {<type>} feeData the fee data
     * @param  {array}  explorers the explorers
     * @param  {<type>} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: <type>() => any);
    derivation: string;
    feePerByte: any;
    coefficient: any;
}
