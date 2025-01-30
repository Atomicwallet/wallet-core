export default KMDCoin;
declare const KMDCoin_base: {
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
 * @class KMDCoin
 */
declare class KMDCoin extends KMDCoin_base {
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
    transactions: any[];
    balances: {
        rewards: string;
    } | {
        rewards: string;
    } | null;
    loadCoreLibrary(): any;
    getNetwork(): Promise<any>;
    getTransactionBuilder(): Promise<any>;
    signInput(txBuilder: any, keyForSign: any, index: any, input: any): Promise<any>;
    /**
     * calculate rewards
     * https://support.komodoplatform.com/support/solutions/articles/29000024428-komodo-5-active-user-reward-all-you-need-to-know
     * constant from
     * https://github.com/LedgerHQ/ledger-nano-s/issues/21
     *
     * get all utxo
     * filter only with value > 10
     * load info about inputs (locktime must be set and > 0)
     * calculate reward
     */
    calculateReward(address: any): Promise<{
        inputs: any[];
        reward: any;
    }>;
    /**
     * crate claim transaction
     *
     * @returns {Promise<void>}
     */
    createClaimTransaction(rewardObject: any): Promise<void>;
    getInfo(): Promise<{
        balance: any;
        balances: {
            rewards: string;
        } | {
            rewards: string;
        };
    }>;
    claim(): Promise<any>;
    setPrivateKey(privateKey: any): void;
    #private;
}
