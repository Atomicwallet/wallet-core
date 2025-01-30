export default FILCoin;
declare const FILCoin_base: {
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
 * @class ETHCoin
 */
declare class FILCoin extends FILCoin_base {
    /**
     * constructs the object.
     *
     * @param  {<type>} alias the alias
     * @param  {<type>} feeData the fee data
     * @param  {array}  explorers the explorers
     * @param  {<type>} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: <type>() => any);
    /** @type {string} */
    web3BaseUrl: string;
    /** @type {import('web3').default|null} */
    coreLibrary: import("web3").default | null;
    web3: Web3Explorer;
    tokens: {};
    nonce: any;
    /**
     * Sets web3 instance to coreLibrary
     * @returns {Promise<void>}
     */
    initCoreLibrary(): Promise<void>;
    /**
     * Gets web3 instance
     * @returns {Promise<import('web3').default>}
     */
    getCoreLibrary(): Promise<import("web3").default>;
    /**
     * Gets Filecoin Address SDK
     * @async
     * @returns {Promise<(import('@glif/filecoin-address'))>}
     */
    getFilecoinAddressSdk(): Promise<(typeof import("@glif/filecoin-address"))>;
    setFeeData(feeData?: {}): void;
    gasLimit: string | undefined;
    gasLimitCoefficient: any;
    isFeeDynamic(): boolean;
    getTransactions(): Promise<any>;
    manageSocket(): void;
    /**
     * Get ETH fee settings
     * @return {Promise<Object>} The ETH fee settings
     */
    getFeeSettings(): Promise<Object>;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<object>}
     */
    loadWallet(seed: any): Promise<object>;
    address: string | undefined;
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {Promise<boolean>}
     */
    validateAddress(address: string): Promise<boolean>;
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @param {string} paymentData The payment id (only HEX value!)
     * @param {string} gasLimit
     * @param {number} multiplier coefficient
     * @return {Promise<string>} Raw transaction
     */
    createTransaction({ address, amount, nonce, gasLimit, paymentData }: string): Promise<string>;
    signTransaction(unsignedTx: any): Promise<string | undefined>;
    /**
     * Send transacrion
     * @async
     * @param {string} rawtx
     * @returns {Promise<Transaction>}
     */
    sendTransaction(rawtx: string): Promise<Transaction>;
    /**
     * Gets max fee per gas from Eth Gas Station
     * For support EIP-1559 standard
     *
     * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas price.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getMaxFeePerGas(gasPriceCoefficient?: number): Promise<string>;
    getNonce(): Promise<any>;
    /**
     * Gets the fee.
     *
     * @param  {Number}  amount In satoshis
     * @param  {Boolean} isSendAll The is send all (default: false)
     * @return {Promise<BN>} The fee.
     */
    getFee({ userGasPrice, gasLimit }?: number): Promise<BN>;
    getGasPrice(withoutCoeff?: boolean): Promise<any>;
    /**
     * Gets moderate gas prices from Eth Gas station
     *
     * @returns {Promise<{standard: BN, fastest: BN} | {}>}
     */
    getModerateGasPrice(): Promise<{
        standard: BN;
        fastest: BN;
    } | {}>;
    estimateGas(amount: any, address: any, contract: any, defaultGas?: string): Promise<string>;
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    availableBalance(fee: any): Promise<string>;
    getInfo(tokenInfo: any): Promise<{
        balance: any;
        balances: any;
    }>;
    gasPrice(): Promise<any>;
    setPrivateKey(privateKey: any): void;
    getGasRange(sendType?: string): any;
    getEstimatedTimeCfg(force?: boolean): Promise<any>;
    gasPriceConfig: any;
    getEstimatedTimeTx(gasPrice: any, mapping?: boolean): Promise<any>;
    /**
     * Sign data with pk
     * @param {string} data
     * @return {Sign}
     */
    signData(data: string): Sign;
    /**
     * Sign with provided 3-th party signer callback
     *
     * @param data Data to sign
     * @param signer Callback function
     * @return {*}
     */
    signWithCustomSigner({ data, signer }: {
        data: any;
        signer: any;
    }): any;
    #private;
}
import Web3Explorer from '../../explorers/collection/Web3Explorer.js';
import BN from 'bn.js';
