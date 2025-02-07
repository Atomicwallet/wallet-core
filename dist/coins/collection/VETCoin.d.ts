export default VETCoin;
declare const VETCoin_base: {
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
 * Vechain
 *
 * @class VETCoin
 */
declare class VETCoin extends VETCoin_base {
    /**
     * constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Array}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string, db: any, configManager: any);
    derivation: string;
    transactions: any[];
    feeTokenContract: string;
    tokens: {};
    get feeWallet(): any;
    get feeTicker(): string;
    getExcludedTokenList(): Promise<never[]>;
    /**
     * Creates a token.
     *
     * @param {...Array} args The arguments
     * @return {VETToken}
     */
    createToken(args: any[][]): VETToken;
    loadTokensList(wallets: any): Promise<void>;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} seed  Seed of Mnemonic
     * @param {string} phrase mnemonic (12 words)
     * @return {Promise<Coin>} The private key.
     */
    loadWallet(seed: BitcoreMnemonic, phrase: string): Promise<Coin>;
    address: string | undefined;
    /**
     * The address getter
     *
     * @return {String}
     */
    getAddress(): string;
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
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount }: string): Promise<string>;
    createTokenTransaction({ contract, amount, dataToSend, fee }: {
        contract: any;
        amount: any;
        dataToSend: any;
        fee: any;
    }): Promise<string>;
    /**
     *
     * @return {Promise<{}>}
     */
    getLatestBlock(): Promise<{}>;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} data The transaction data, default = 0x - null
     * @param {Number} fee The fee in VTHO!
     * @return {Promise<String>} Raw transaction
     */
    createTransactionWithData(to: any, amount: number, data: string, fee: number): Promise<string>;
    convertGasToVTHO(value: any): number;
    convertVTHOToGas(value: any): number;
    getInfo(): Promise<{
        balance: any;
        energy: any;
    }>;
    /**
     * @returns {BN}
     */
    getFee(): BN;
    /**
     * Fee for vechain in VTHO token!
     *
     * @return {Promise<Boolean>} True if available for fee, False otherwise.
     */
    isAvailableForFee(): Promise<boolean>;
    availableBalance(): Promise<any>;
    fetchUserTokens(wallets: any): Promise<never[]>;
    getTransactions(args: any): Promise<never[]>;
    setPrivateKey(privateKey: any): void;
    #private;
}
import { VETToken } from '../../tokens/index.js';
import { Coin } from '../../abstract/index.js';
