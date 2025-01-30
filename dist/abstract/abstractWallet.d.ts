import BN from 'bn.js';
import type { Coin, Token, WalletDecimal, CreateTxParams, RawTxHash, TxHash, RawTxHex, RawTxBinary, RawTxObject, WalletIdentifierType, WalletTicker, TokenCreationArgs, CoinConfigType, ILogger } from '../abstract/index.js';
import type Explorer from '../explorers/explorer.js';
import { IConfigManager } from '../utils/configManager/index.js';
import { IDataBase, ITable, TableNames, TableTypes } from '../utils/db/index.js';
interface IGasPriceConfig {
    [key: string]: unknown;
}
/**
 * Base class for any asset presented to the user.
 */
export default abstract class AbstractWallet {
    #private;
    memoRegexp?: string;
    alias: string;
    indivisibleBalance: null | BN;
    divisibleBalance: null | string;
    configManager: IConfigManager;
    logger: ILogger;
    abstract gasPriceConfig?: IGasPriceConfig;
    abstract gasLimit?: string | number | BN;
    abstract denom?: string;
    abstract get id(): string;
    abstract get address(): string;
    abstract get deprecatedParent(): string;
    abstract get contract(): string;
    abstract get feeWallet(): Coin | Token;
    abstract availableBalance(fees?: string): Promise<string>;
    abstract createTransaction(args: CreateTxParams): Promise<RawTxHex | RawTxBinary | RawTxObject>;
    abstract sendRawTransaction(args: RawTxHex | RawTxBinary | RawTxObject): Promise<RawTxHash>;
    abstract getGasPrice(withoutCoeff: boolean, isToken?: boolean): Promise<BN | number | string>;
    abstract estimateGas(amount: BN | string, address: string, contract: string, defaultGas?: BN | string | number): Promise<BN | number | string>;
    abstract getFeePerByte(): BN;
    abstract getUnspentOutputs(): Promise<any>;
    constructor({ name, ticker, decimal, memoRegexp }: CoinConfigType | TokenCreationArgs, db?: IDataBase, configManager?: IConfigManager, logger?: ILogger);
    protected set ticker(ticker: string);
    get ticker(): string;
    protected set decimal(decimal: number);
    get decimal(): number;
    protected set name(name: string);
    get name(): string;
    get networkType(): string;
    get explorer(): Explorer | undefined;
    get eventEmitter(): import("events")<[never]>;
    getDbTable<T extends TableNames>(tableName: T): ITable<TableTypes[T]>;
    isStakingSupported(): boolean;
    toMinimalUnit(value: string | BN, decimal?: WalletDecimal): string;
    toCurrencyUnit(value: string | BN, decimal?: WalletDecimal): string;
    /**
     * Gets the actual balance
     *
     * @return {String} Balance in satoshis
     */
    get balance(): string | null;
    /**
     * Sets currency value from satoshi when balance set.
     *
     * @param {String|BN} value The value
     */
    set balance(value: string | null);
    /**
     * Get fee ticker
     *
     * @return {String} The fee ticker
     */
    get feeTicker(): string;
    getFeeSettings(): {};
    canRun(funcName: string): boolean;
    sendTransaction(rawtx: RawTxHex | RawTxBinary | RawTxObject): Promise<unknown>;
    createTransactionOnce(params: CreateTxParams): {};
    sendTransactionOnce(params: RawTxHex | RawTxBinary | RawTxObject): {};
    sendRawTransactionOnce(params: CreateTxParams): {};
    /**
     * Gets the transaction info.
     *
     * @param {String} txId The transaction identifier.
     * @return {Promise<Object>} The transaction.
     */
    getTransaction(txId: TxHash): Promise<object | undefined>;
    /**
     * Determines if the amount is available for send.
     */
    isAvailableForSend(amount: string, fee?: string): Promise<boolean>;
    /**
     * Returns a ticker that a user should see in the connection.
     */
    getUserTicker(): WalletTicker;
    validateMemo(memo: string): boolean;
    getTxLimit(): number | undefined;
    get canPaginate(): boolean | undefined;
    /**
     * Returns stub is NFT supported sign
     */
    isNftSupported(): boolean;
    /**
     * Comparing instance values with given ones
     */
    isMatch({ ticker, contract, parent, address, network, chainId }: WalletIdentifierType): boolean;
}
export {};
