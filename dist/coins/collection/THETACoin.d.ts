export default THETACoin;
declare const THETACoin_base: {
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
 * @class THETACoin
 */
declare class THETACoin extends THETACoin_base {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, network, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        network?: string | undefined;
        id: any;
    }, db: any, configManager: any);
    derivation: string;
    defaultFee: any;
    resendTimeout: any;
    tokens: {};
    get feeWallet(): any;
    get feeTicker(): any;
    loadTokensList(wallets: any): Promise<void>;
    createToken(args: any): THETAToken;
    getTokenList(): {
        id: any;
        name: any;
        ticker: any;
        decimal: any;
        visibility: any;
    }[];
    loadWallet(seed: any, phrase: any): Promise<{
        id: any;
        privateKey: any;
        address: any;
    }>;
    address: any;
    /**
     * Validates wallet address
     *
     * @param {string} address
     * @return {boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Creates a transaction.
     *
     * @param {object} txData
     * @param {string} txData.address - Destination address
     * @param {string | number} txData.amount - Amount in minimal units
     * @param {string | number | BN} txData.nonce - Tx nonce
     * @param {string} txData.ticker - Ticker of sending coin (`TFUEL` / `THETA`)
     * @param {string | number} txData.userFee - Total fee in `TFUEL` minimal units
     * @return {Promise<string>} Raw transaction
     */
    createTransaction({ address, amount, nonce, ticker, userFee }: {
        address: string;
        amount: string | number;
        nonce: string | number | BN;
        ticker: string;
        userFee: string | number;
    }): Promise<string>;
    createTokenTransaction(payload: any): Promise<string>;
    /**
     * Get available balance for a passed wallet. Wallet can be the coin itself or any THETA token.
     * Don't use it if you don't know what you are doing! Use wallet.availableBalance() instead.
     *
     * @param {Object} wallet wallet to get available balance for
     * @param {string} fee user fee
     * @returns {Promise<string>}
     */
    getAvailableBalanceForWallet(wallet: Object, fee: string): Promise<string>;
    /**
     * Return available balance for send
     *
     * @return {Promise<string>} In currency units
     */
    availableBalance(fee: any): Promise<string>;
    getInfo(): Promise<{
        nonce: any;
        balance: any;
    }>;
    setPrivateKey(privateKey: any, phrase: any): Promise<void>;
    checkTransaction(txInfo: any): Promise<void>;
    updateNonce(): Promise<any>;
    updateInfo(): Promise<{
        nonce: any;
        balance: any;
    }>;
    nonce: any;
    getFee(): Promise<any>;
    /**
     * Does fee wallet has enough balance to send transactions.
     *
     * @param {BN} [userFee] fee set by user, default fee is used if not argument is not passed or zero
     * @returns {Promise<boolean>}
     */
    hasEnoughFeeBalance(userFee?: BN): Promise<boolean>;
    /**
     * Is this wallet available for sending transactions.
     *
     * @param {BN} [userFee] fee set by user
     * @returns {Promise<boolean>}
     */
    isAvailableForFee(userFee?: BN): Promise<boolean>;
    #private;
}
import { THETAToken } from '../../tokens/index.js';
