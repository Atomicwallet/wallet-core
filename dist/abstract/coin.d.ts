import BN from 'bn.js';
import type { CoinConfigType, FeeDataType, Numeric, RawTxBinary, RawTxHex, RawTxObject, TokensObject } from '../abstract/index.js';
import { AbstractWallet } from '../abstract/index.js';
import { CoinFeature } from '../coins/constants.js';
import type Explorer from '../explorers/explorer.js';
import type Transaction from '../explorers/Transaction.js';
import { IKeysObject, type LazyLoadedLib, TxNotifier } from '../utils/index.js';
import { IConfigManager } from '../utils/configManager/index.js';
import { IDataBase } from '../utils/db/index.js';
type ExplorersModules = {
    [key: string]: Explorer;
};
/**
 * Abstract class for wallets.
 *
 * @abstract
 * @class Coin
 */
export default abstract class Coin extends AbstractWallet {
    #private;
    dependencies: {
        [name: string]: LazyLoadedLib<unknown>;
    };
    explorersModules: ExplorersModules;
    config: CoinConfigType;
    features: string[];
    transactions: Transaction[];
    BN: typeof BN;
    fields: Record<string, unknown>;
    plugins: unknown[];
    unspendableBalance: string;
    feeData: FeeDataType;
    txNotifier: TxNotifier;
    explorers: Explorer[];
    txWebUrl: string;
    confirmed: boolean;
    nonce?: Numeric;
    balances?: unknown;
    socket?: boolean;
    fee?: Numeric;
    tokens?: TokensObject;
    coefficient?: number;
    chainId?: number;
    assetName?: string;
    gasLimit?: string | number | BN;
    coreLib?: unknown;
    coreLibrary?: unknown;
    denom?: string;
    l2Name?: string;
    isUseModeratedGasPrice?: boolean;
    isUseEIP1559?: boolean;
    feeTRC20?: string;
    feeDenom?: string;
    KeysObject?: unknown;
    isTestnet?: boolean;
    network?: string;
    atomicId?: string;
    abstract getTickerFromDenom(arg: string): string;
    abstract getClient(): unknown;
    abstract getProvider(usedFor: string): Explorer;
    abstract getTRC20Fee(feeTRC20Object: unknown): string;
    abstract getScriptPubKey(): unknown;
    abstract createTokenTransaction(args: unknown): Promise<RawTxHex | RawTxBinary | RawTxObject>;
    abstract getTokenTransactions(args: unknown): Transaction[];
    abstract getTokenInfo(args: unknown): string | null;
    abstract removeTokenFromDb(args: unknown): void;
    constructor(config: CoinConfigType, db?: IDataBase, configManager?: IConfigManager);
    loadLib(name: string): Promise<unknown>;
    protected set id(id: string);
    get id(): string;
    protected set address(address: string);
    get address(): string;
    protected get derivation(): string;
    protected set derivation(derivation: string);
    get deprecatedParent(): string;
    get isCustomTokenSupported(): boolean;
    /**
     * Get fee wallet instance
     */
    get feeWallet(): this;
    /**
     * Don't use it! Use the wallet itself, you don't need `instance`.
     * @private
     * @deprecated
     */
    get instance(): {
        readonly id: string;
        readonly ticker: string;
        readonly chainId: number | undefined;
        readonly name: string;
        readonly alias: string;
        readonly assetName: string | undefined;
        readonly decimal: number;
        readonly parent: string;
        readonly feeCoefficient: number | undefined;
        readonly feeDefault: Numeric | undefined;
        readonly reserveForStake: Numeric | undefined;
        readonly gasLimit: string | number | BN | undefined;
        readonly address: string;
        readonly account: string;
        readonly coreLibrary: unknown;
        readonly coreLib: unknown;
        readonly denom: string | undefined;
        readonly feeTRC20: Numeric | undefined;
        readonly l2Name: string | undefined;
        readonly atomicId: string | undefined;
        feeDenom: () => string | undefined;
        getTickerFromDenom: (value: string) => string;
        isTestnet: () => boolean | undefined;
        toCurrencyUnit: (value: string) => string;
        toMinimalUnit: (value: string) => string;
        getClient: () => unknown;
        tokens: () => TokensObject | undefined;
        getFee: (feeObject: unknown) => Promise<BN>;
        getTokens: () => TokensObject | undefined;
        getProvider: (usedFor: string) => Explorer;
        getTRC20Fee: (feeTRC20Object: unknown) => string;
        BN: typeof BN;
    };
    /**
     * The active explorer getter.
     */
    get explorer(): Explorer | undefined;
    /**
     * Get private keys object
     */
    get privateKeysObject(): {};
    /**
     * Set private keys object
     */
    set privateKeysObject(privateKeysObject: {});
    setExplorersModules(explorerModules: Explorer[]): void;
    /**
     * Define whether the network fee is dynamic
     */
    isFeeDynamic(): boolean;
    /**
     * Transaction id URL
     */
    getWebTransactionUrl(id: string): string;
    manageSocket(): void;
    manageEvents(): void;
    /**
     * Processes a new tx got from the socket (does nothing by default)
     */
    onConfirmSocketTx(tx: object): void;
    /**
     * Gets the fee.
     *
     * @param {string} amount Amount to transfer in minimal quantum (satoshi, drops and etc)
     * @param {boolean} isSendAll
     *
     * @return {BN} The fee big number
     */
    getFee(args?: unknown): Promise<BN>;
    /**
     * Gets the address.
     */
    getAddress(): void;
    /**
     * Sets the public key.
     */
    setAddress(address: string): void;
    /**
     * Sets the private key.
     */
    setPrivateKey(privateKey: string, mnemonic?: string): Promise<void>;
    /**
     * Validates wallet address
     */
    validateAddress(address: string): Promise<void>;
    /**
     * Gets the wallet.
     */
    loadWallet(seed?: Buffer, mnemonic?: string): Promise<IKeysObject>;
    checkTransaction(txInfo: any): Promise<void>;
    /**
     * Gets the information about a wallet.
     */
    getInfo(): Promise<{
        balance: string | null;
        nonce?: Numeric | null;
    }>;
    /**
     * Gets the balance.
     */
    getBalance(): Promise<string | null>;
    /**
     * Gets the transactions.
     */
    getTransactions(args: any): Promise<Transaction[]>;
    /**
     * Return available balance for send
     */
    availableBalance(fees: any): Promise<string>;
    /**
     * Check amount + fee < balance
     */
    isAvailableForSend(amount: string, fee: string): Promise<boolean>;
    createExplorer(config: any): any;
    processExplorerConfig(config: any): any;
    /**
     * Process config feeData.
     */
    private setFeeData;
    updateConfigValue<K extends keyof CoinConfigType>(key: K, value: CoinConfigType[K]): void;
    /**
     * Update dynamic data set
     */
    updateCoinParamsFromServer(data: CoinConfigType): void;
    install(): void;
    /**
     * Process explorers configuration.
     */
    private loadExplorers;
    /**
     * Gets the unspent transaction outputs.
     */
    getUnspentOutputs(): Promise<any>;
    createTokenTransactionOnce(params: any): {};
    /**
     * Is feature supported by this coin network.
     */
    isFeatureSupported(feature: CoinFeature): boolean;
    /**
     * Is NFT supported by this coin network.
     *
     * @deprecated - Use isFeatureSupported method instead.
     */
    isNftSupported(): boolean;
}
export {};
