export default EOSCoin;
declare const EOSCoin_base: {
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
declare class EOSCoin extends EOSCoin_base {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object}  feeData represents fee
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string);
    derivation: string;
    assetName: string;
    accountActivationSum: any;
    accountActivationAddress: any;
    transactions: any[];
    balances: {
        net: any;
        cpu: any;
        ram: {
            ramUsage: any;
            ramQuota: any;
            ramBytesTotal: any;
        };
        staked: {
            selfStakedNet: number;
            selfStakedCpu: number;
            othersStakedNet: number;
            othersStakedCpu: number;
            totalStakedNet: number;
            totalStakedCpu: number;
        };
    } | null;
    /**
     * @deprecated this is not related to coin activation, don't use it. Remove it if there is nothing using this.
     */
    get activated(): boolean;
    /**
     * Loads a wallet.
     *
     * @param {Buffer} seed Seed buffer from BitcoreMnemonic
     * @param {String} phrase The mnemonic string
     * @return {Promise<Coin>}
     */
    loadWallet(seed: Buffer, phrase: string): Promise<Coin>;
    privateKeysObject: {
        owner: {
            privateKey: any;
            publicKey: any;
        };
        active: {
            privateKey: any;
            publicKey: any;
        };
    } | undefined;
    resolveAccountName(activePublicKey: any): any;
    address: any;
    /**
     * The address getter
     *
     * @return {String}
     */
    getAddress(): string;
    validateNewAccountName(account: any): Promise<any>;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} memo Payment id / memo string
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount, memo }: string): Promise<string>;
    sendTransaction(rawtx: any): Promise<any>;
    getInfo(): Promise<{
        balance: any;
        balances: {
            net: any;
            cpu: any;
            ram: {
                ramUsage: any;
                ramQuota: any;
                ramBytesTotal: any;
            };
            staked: {
                selfStakedNet: number;
                selfStakedCpu: number;
                othersStakedNet: number;
                othersStakedCpu: number;
                totalStakedNet: number;
                totalStakedCpu: number;
            };
        } | null;
    }>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { Coin } from '../../abstract/index.js';
