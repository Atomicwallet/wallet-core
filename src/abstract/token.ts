import BN from 'bn.js';
import { AbstractWallet, type Coin } from 'src/abstract';
import type Transaction from 'src/explorers/Transaction';
import { getTokenId } from 'src/utils';

import type {
  CreateTxParams,
  RawTxBinary,
  RawTxHex,
  RawTxObject,
  TxHash,
  TokenCreationArgs,
  TokenSource,
  CoinConfigType,
} from './index';
import { HISTORY_WALLET_UPDATED } from '@/utils/eventTopics';

const tokensNetworks = new Set(['BNB', 'TRX', 'ETH', 'MATIC', 'BSC', 'LUNA', 'BASE']);

abstract class Token extends AbstractWallet {
  #parent: Coin;
  #id: string;
  #contract: string;

  confirmed: boolean;
  visibility: boolean;
  source: TokenSource;
  config?: CoinConfigType;
  BN: typeof BN;

  fields = { paymentId: false };
  transactions: Transaction[];
  isSetBalance: boolean;
  notify: boolean;

  /**
   * Constructs a new instance of the class.
   *
   * @param {Coin} args.parent The parent cin instance
   * @param {string} args.name The token name
   * @param {string} args.ticker The token ticker
   * @param {number} args.decimal The decimal precision
   * @param {string} args.contract The contract key
   * @param {boolean} args.source 'list' | 'user' | 'custom'
   * @param {boolean} args.visibility
   * @param {boolean} args.confirmed
   * @param {{}} args.config
   */
  constructor(args: TokenCreationArgs) {
    super(args);

    this.#parent = args.parent;
    this.#contract = args.contract;
    this.#id = getTokenId({
      contract: this.contract,
      parent: this.#parent.id,
      ticker: this.ticker,
    });

    this.source = args.source;
    this.visibility = args.visibility;
    this.confirmed = args.confirmed;

    this.decimal = args.decimal;

    if (args.config) {
      this.config = args.config;
    }

    // Object.entries(args).forEach(([key, val]) => {
    //   if (key === 'parent') {
    //     this.#parent = val
    //   } else {
    //     this[key] = val
    //   }
    // })

    this.BN = BN;
    this.balance = '';
    this.transactions = [];
    this.isSetBalance = false;
    this.notify = Boolean(args.notify);

    this.manageEvents();
  }

  get id() {
    return this.#id;
  }

  protected set id(id) {
    this.#id = id;
  }

  get contract(): string {
    return this.#contract;
  }

  protected set contract(contract) {
    this.#contract = contract;
  }

  /**
   * Address
   * @returns {string}
   */
  get address() {
    return this.#parent.address;
  }

  /**
   * Token network
   * @returns {string}
   */
  get network() {
    return this.#parent.id;
  }

  get networkType() {
    return this.#parent.networkType;
  }

  /**
   * Get fee wallet instance
   * @return {Coin | Token}
   */
  get feeWallet() {
    return this.#parent;
  }

  get feeTicker() {
    return this.#parent.id;
  }

  /**
   * Should be removed
   * @return {*}
   */
  get deprecatedParent() {
    return this.#parent.id;
  }

  /**
   * Transaction base url
   *
   * @returns {string}
   */
  get txWebUrl() {
    return this.#parent.txWebUrl;
  }

  /**
   * Parent corelib
   *
   * @return {*}
   */
  get coreLibrary() {
    return this.#parent.coreLibrary;
  }

  /**
   * Determines token custom source
   *
   * @returns {boolean}
   */
  get isCustom() {
    return this.source === 'custom';
  }

  getWebTransactionUrl(id: string) {
    return this.#parent.getWebTransactionUrl(id);
  }

  getTxLimit(): number | undefined {
    return this.#parent.getTxLimit();
  }

  /**
   * Gets the wallet.
   *
   * @param {String} mnemonic The mnemonic phrase.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(mnemonic: string) {
    return this;
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @param {String} network The network
   * @return {Boolean}
   */
  async validateAddress(address: string) {
    return this.#parent.validateAddress(address);
  }

  createTransaction(args: CreateTxParams): Promise<RawTxHex | RawTxBinary | RawTxObject> {
    return this.#parent.createTokenTransaction({
      ...args,
      contract: this.contract,
    });
  }

  createRawTransactions(args: CreateTxParams) {
    return this.#parent.createTransaction(args);
  }

  sendTransaction(args: RawTxHex | RawTxObject | RawTxBinary) {
    return this.#parent.sendTransaction(args);
  }

  /**
   * Gets the information about a wallet.
   *
   * @return {Promise<Object>} The information data.
   */
  async getInfo() {
    if (this.#parent.getTokenInfo) {
      this.balance = await this.#parent.getTokenInfo({
        contract: this.contract,
      });
    }

    return {
      balance: this.balance,
    };
  }

  /**
   * Gets the available balance.
   *
   * @return {Promise<String>} The balance.
   */
  async availableBalance() {
    return this.divisibleBalance ? String(this.divisibleBalance) : '0';
  }

  /**
   *
   * @param {string} fee
   * @return {Promise<*>}
   */
  async isAvailableForFee(fee: string) {
    return this.#parent.indivisibleBalance?.gte(new this.BN(fee));
  }

  /**
   * Gets the fee.
   *
   * @param {String} amount Amount to transfer in satoshis
   * @param {Boolean} isSendAll
   * @param {String} userGasPrice optional custom gas price
   * @param {String} userGasLimit optional custom gas limit
   * @return {Promise<BN>} The fee big number
   */
  getFee(args: any) {
    return this.#parent.getFee(args);
  }

  getGasPrice(withoutCoeff: boolean, isToken?: boolean): Promise<BN | number | string> {
    return this.#parent.getGasPrice(withoutCoeff, isToken);
  }

  estimateGas(
    amount: BN | string,
    address: string,
    contract: string,
    defaultGas?: BN | string | number,
  ): Promise<BN | number | string> {
    return this.#parent.estimateGas(amount, address, contract, defaultGas);
  }

  async getTokenTransactions() {
    try {
      const txs = await this.#parent.getTokenTransactions({
        contract: this.contract,
      });

      if (txs.length > 0) {
        const tokenTransactions = txs.filter((tx: any) => tx.walletId === this.#id);

        // await history.filterAndUpdateTransactions(tokenTransactions);
        const { topic, payload } = HISTORY_WALLET_UPDATED(this.id, tokenTransactions);

        this.eventEmitter.emit(topic, payload);
        this.transactions = tokenTransactions;
      }

      return txs;
    } catch (error) {
      return this.transactions;
    }
  }

  /**
   * @param offset
   * @param limit
   * @returns {Promise<Array>}
   */
  async getTransactions(offset: number, limit: number) {
    try {
      const txs = await this.#parent.getTransactions({
        contract: this.contract,
        offset,
        limit,
      });

      if (txs.length > 0) {
        const tokenTransactions = txs.filter((tx: any) => tx.walletId === this.#id);

        // await history.filterAndUpdateTransactions(tokenTransactions);
        const { topic, payload } = HISTORY_WALLET_UPDATED(this.id, tokenTransactions);

        this.eventEmitter.emit(topic, payload);
        this.transactions = tokenTransactions as Transaction[];
      }

      return txs;
    } catch (error) {
      return this.transactions;

      // @TODO should be implemented for all token types
      // by default returns empty array
      // throw new Error(`${this.constructor.name}: method \`getTokenTransactions\`
      // should be defined in ${this.#parent.constructor.name}`)
    }
  }

  checkTransaction(args: any) {
    return this.#parent.checkTransaction(args);
  }

  /**
   * @param txId
   * @returns {Promise<Promise<Transaction>>}
   */
  async getTransaction(txId: TxHash) {
    return this.#parent.getTransaction(txId);
  }

  /**
   * Update dynamic data set
   *
   * @param {Object} data The data
   */
  updateTokenParamsFromServer(data: CoinConfigType) {
    if (!data?.feeData) {
      return;
    }
    Object.entries(data.feeData).forEach(([key, value]) => {
      if (typeof this[key] !== 'undefined' && typeof value !== 'undefined' && key !== '__proto__') {
        this[key] = value;
      }
    });
  }

  isTagShown() {
    return tokensNetworks.has(this.#parent.id);
  }

  manageEvents() {
    this.eventEmitter.on(`${this.#parent.id}-${this.id}::new-socket-tx`, ({ unconfirmedTx }) => {
      this.eventEmitter.emit(`${this.#parent.id}::new-token-tx`, {
        token: this,
        unconfirmedTx,
      });
    });
  }

  /**
   * isActivated getter
   * Allows to determine if a token is activated.
   *
   * @returns {boolean}
   */
  get isActivated() {
    return this.#parent.isActivated;
  }

  /**
   * Activates token
   * Also activates the parent coin and all associated tokens.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    return this.#parent.activate();
  }

  /**
   * Deactivates token
   * Also deactivates the parent coin and all associated tokens.
   *
   * @returns {void}
   */
  deactivate() {
    return this.#parent.deactivate();
  }

  removeTokenFromDb(args: object[]) {
    return this.#parent.removeTokenFromDb(args);
  }
}

export default Token;
