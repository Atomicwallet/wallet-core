import BN from 'bn.js';
import type {
  Coin,
  Token,
  WalletDecimal,
  CreateTxParams,
  RawTxHash,
  TxHash,
  RawTxHex,
  RawTxBinary,
  RawTxObject,
  WalletIdentifierType,
  WalletTicker,
  TokenCreationArgs,
  CoinConfigType,
} from 'src/abstract';
import type Explorer from 'src/explorers/explorer';
import { Emitter, defaultConfigManager } from 'src/utils';
import { IConfigManager } from 'src/utils/configManager';
import { WALLETS } from 'src/utils';
import { toMinimal, toCurrency } from 'src/utils/convert';
import { BaseDatabase, IDataBase, ITable, TableNames, TableTypes } from 'src/utils/db';

const SEND_TIMEOUT = 5000;
const delayed = {};

interface IGasPriceConfig {
  [key: string]: unknown;
}
/**
 * Base class for any asset presented to the user.
 */
export default abstract class AbstractWallet {
  #name: string;
  #ticker: string;
  #decimal: number;

  memoRegexp?: string;

  alias: string;

  indivisibleBalance: null | BN = null;
  divisibleBalance: null | string = null;

  configManager: IConfigManager;

  db: IDataBase;

  abstract gasPriceConfig?: IGasPriceConfig;
  abstract gasLimit?: string | number | BN;

  abstract denom?: string;

  abstract get id(): string;
  abstract get address(): string;

  abstract get deprecatedParent(): string;

  abstract get contract(): string;

  abstract get feeWallet(): Coin | Token;

  abstract availableBalance(fees?: string | BN): Promise<string>;
  abstract createTransaction(args: CreateTxParams): Promise<RawTxHex | RawTxBinary | RawTxObject>;

  abstract sendRawTransaction(args: RawTxHex | RawTxBinary | RawTxObject): Promise<RawTxHash>;

  abstract getGasPrice(withoutCoeff: boolean, isToken?: boolean): Promise<BN | number | string>;

  abstract estimateGas(
    amount: BN | string,
    address: string,
    contract: string,
    defaultGas?: BN | string | number,
  ): Promise<BN | number | string>;

  abstract getFeePerByte(): BN;
  abstract getUnspentOutputs(): Promise<any>;

  constructor(
    { name, ticker, decimal, memoRegexp }: CoinConfigType | TokenCreationArgs,
    db?: IDataBase,
    configManager?: IConfigManager,
  ) {
    this.#name = name;
    this.#ticker = ticker;
    this.#decimal = decimal;

    this.configManager = configManager ?? defaultConfigManager;
    this.db = db ?? new BaseDatabase();
    this.alias = 'atomic';
    this.memoRegexp = memoRegexp;
  }

  protected set ticker(ticker: string) {
    this.#ticker = ticker;
  }

  get ticker() {
    return this.#ticker;
  }

  protected set decimal(decimal: number) {
    this.#decimal = decimal;
  }

  get decimal() {
    return this.#decimal;
  }

  protected set name(name: string) {
    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  get networkType() {
    return '';
  }

  get explorer(): Explorer | undefined {
    return undefined;
  }

  get eventEmitter() {
    return Emitter;
  }

  getDbTable<T extends TableNames>(tableName: T): ITable<TableTypes[T]> {
    return this.db.table(tableName);
  }

  isStakingSupported(): boolean {
    return false;
  }

  toMinimalUnit(value: string | BN, decimal?: WalletDecimal): string {
    return toMinimal(value || '0', decimal || this.decimal);
  }

  toCurrencyUnit(value: string | BN, decimal?: WalletDecimal): string {
    return toCurrency(value, decimal || this.decimal);
  }

  /**
   * Gets the actual balance
   *
   * @return {String} Balance in satoshis
   */
  get balance(): string | null {
    return this.indivisibleBalance ? this.indivisibleBalance.toString() : null;
  }

  /**
   * Sets currency value from satoshi when balance set.
   *
   * @param {String|BN} value The value
   */
  set balance(value: string | null) {
    const isValidValue = value !== null && value !== '' && value !== undefined;

    const oldBalance = this.divisibleBalance;

    if (isValidValue) {
      this.indivisibleBalance = new BN(String(value));
      this.divisibleBalance = this.toCurrencyUnit(value);
    }

    if (this.eventEmitter) {
      this.eventEmitter.emit(`update::${this.deprecatedParent}::token`, this.id);
    }

    if (this.eventEmitter && this.divisibleBalance !== oldBalance && !!oldBalance) {
      this.eventEmitter.emit(WALLETS.BALANCE_UPDATED, { wallet: this });
    }
  }

  /**
   * Get fee ticker
   *
   * @return {String} The fee ticker
   */
  get feeTicker() {
    return this.ticker;
  }

  getFeeSettings() {
    return {};
  }

  /*
   * Wrappers for createTransaction, createTokenTransaction with double-send prevent check
   *
   */

  canRun(funcName: string) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if ((delayed[funcName] ?? 0) + SEND_TIMEOUT <= Date.now()) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delayed[funcName] = Date.now();
      return true;
    }
    return false;
  }

  async sendTransaction(rawtx: RawTxHex | RawTxBinary | RawTxObject): Promise<unknown> {
    return this.explorer && this.explorer.sendTransaction(rawtx);
  }

  createTransactionOnce(params: CreateTxParams) {
    return this.canRun('createTransaction') ? this.createTransaction(params) : {};
  }

  sendTransactionOnce(params: RawTxHex | RawTxBinary | RawTxObject) {
    return this.canRun('sendTransaction') ? this.sendTransaction(params) : {};
  }

  sendRawTransactionOnce(params: CreateTxParams) {
    return this.canRun('sendRawTransaction') ? this.sendRawTransaction(params) : {};
  }

  /**
   * Gets the transaction info.
   *
   * @param {String} txId The transaction identifier.
   * @return {Promise<Object>} The transaction.
   */
  async getTransaction(txId: TxHash): Promise<object | undefined> {
    return this.explorer && this.explorer.getTransaction(this.address, txId);
  }

  /**
   * Determines if the amount is available for send.
   */
  async isAvailableForSend(amount: string, fee?: string): Promise<boolean> {
    const availableBalance = await this.availableBalance();

    return new BN(this.toMinimalUnit(amount)).lte(new BN(this.toMinimalUnit(availableBalance)));
  }

  /**
   * Returns a ticker that a user should see in the connection.
   */
  getUserTicker(): WalletTicker {
    return this.ticker;
  }

  validateMemo(memo: string): boolean {
    if (this.memoRegexp) {
      return new RegExp(this.memoRegexp).test(memo);
    }
    return false;
  }

  getTxLimit(): number | undefined {
    return this.explorer && this.explorer.getTxLimit();
  }

  get canPaginate() {
    return this.explorer && this.explorer.canPaginate;
  }

  /**
   * Returns stub is NFT supported sign
   */
  isNftSupported(): boolean {
    return false;
  }

  /**
   * Comparing instance values with given ones
   */
  isMatch({ ticker, contract, parent, address, network, chainId }: WalletIdentifierType): boolean {
    const optional: Partial<WalletIdentifierType> = {
      contract,
      parent,
      address,
      network,
      chainId,
    };

    if (!ticker) {
      throw new Error('Parameter `ticker` or `id` is required');
    }

    const requiredEq = this.ticker.toLowerCase() === ticker.toLowerCase();

    return Object.keys(optional).reduce((result, key) => {
      if (key in this) {
        const thisValue = this[key as keyof AbstractWallet];
        const optionalValue = optional[key as keyof WalletIdentifierType];

        if (thisValue && typeof thisValue !== 'object' && typeof optionalValue !== 'object') {
          return result && thisValue.toString().toLowerCase() === optionalValue!.toString().toLowerCase();
        }
      }
      return result;
    }, requiredEq);
  }
}
