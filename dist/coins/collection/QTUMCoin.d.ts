export default QTUMCoin;
declare const QTUMCoin_base: {
    new (): {
        [x: string]: any;
        "__#14@#privateKey": any;
        loadWallet(seed: any): Promise<Object>;
        address: string | undefined;
        getNetwork(): Promise<any>;
        getAddress(privateKey?: any): string;
        getAddressFromPublicKey(publicKey: any): Promise<any>;
        validateAddress(address: string): boolean;
        getTransactionBuilder(): Promise<any>;
        addInput(txBuilder: any, input: any): void;
        signInput(txBuilder: any, keyForSign: any, index: any, input: any): void;
        createClaimTransaction(privateKey: string): Promise<string>;
        createTransaction({ address, amount }: string): Promise<string>;
        buildTx(inputs: any, address: any, amount: any, change: any, privateKey: any, otherSideAddr: undefined, version: any): Promise<any>;
        getKeyForSignFromPrivateKey(privateKey?: any): Promise<any>;
        getScriptPubKey(): Promise<any>;
        setPrivateKey(privateKey: any): void;
    };
    [x: string]: any;
};
/**
 * Class
 *
 * @class QTUMCoin
 */
declare class QTUMCoin extends QTUMCoin_base {
    /**
     * @typedef FeeConfigData
     * @type {object}
     * @property {number|string} feePerByte
     * @property {number|string} coefficient
     * @property {number|string} [unspendableBalance]
     */
    /**
     * constructs the object.
     *
     * @param {object} config
     * @param {string} config.id
     * @param {string} config.ticker
     * @param {string} config.name
     * @param {string} config.alias
     * @param {string[]} [config.features]
     * @param {FeeConfigData} config.feeData
     * @param {ExplorerConfig[]} config.explorers
     * @param {string} config.txWebUrl
     * @param {boolean} config.socket
     * @param {boolean} [config.notify=false]
     */
    constructor(config: {
        id: string;
        ticker: string;
        name: string;
        alias: string;
        features?: string[] | undefined;
        feeData: {
            feePerByte: number | string;
            coefficient: number | string;
            unspendableBalance?: string | number | undefined;
        };
        explorers: ExplorerConfig[];
        txWebUrl: string;
        socket: boolean;
        notify?: boolean | undefined;
    });
    derivation: string;
    network: any;
    setFeeData(feeData?: {}): void;
    feePerByte: string | undefined;
    coefficient: any;
    unspendableBalance: any;
}
