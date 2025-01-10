/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck

import BN from 'bn.js';
import isEqual from 'lodash/isEqual';

import {
  ExplorerRequestError,
  ExternalError,
  UndeclaredAbstractMethodError,
} from '../errors';
import { AbstractWallet } from '@/abstract';
import type {
  RawTxBinary,
  RawTxHex,
  RawTxObject,
  CoinConfigType,
  FeeDataType,
  Numeric,
  TokensObject,
} from '@/abstract';
import { CoinFeature } from '@/coins/constants';
import type Explorer from '@/explorers/Explorer';
import type Transaction from '@/explorers/Transaction';
import { TxNotifier } from '@/utils';
import { type LazyLoadedLib } from '@/utils';
import { GET_TRANSACTIONS_TYPE, TxEventTypes } from '@/utils/const';

const WALLETS_WITH_CUSTOM_TOKENS = ['ETH'];
const CHECK_TX_UPDATE_TIMEOUT = 3000;

type ExplorersModules = {
  [key: string]: Explorer;
};

/**
 * Abstract class for wallets.
 *
 * @abstract
 * @class Coin
 */
abstract class Coin extends AbstractWallet {
  #id: string;
  #address: string;
  dependencies: { [name: string]: LazyLoadedLib };
  #derivation: string;

  explorersModules: ExplorersModules;

  config: CoinConfigType;
  features: string[];

  transactions: Transaction[];
  BN: typeof BN;
  fields: object;
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
  abstract createTokenTransaction(
    args: unknown,
  ): Promise<RawTxHex | RawTxBinary | RawTxObject>;

  abstract getTokenTransactions(args: unknown): Transaction[];
  abstract getTokenInfo(args: unknown): string | null;

  abstract removeTokenFromDb(args: unknown): void;

  constructor(config: CoinConfigType) {
    super(config);

    this.dependencies = config.dependencies || {};
    this.config = config;

    this.#id = config.id;
    this.dependencies = config.dependencies ?? {};

    this.explorersModules = {};

    // @TODO refactor
    this.coreLibrary = config.coreLibrary;
    this.coreLib = config.coreLib;

    this.#address = '';
    this.#derivation = '';

    this.socket = config.socket;
    this.unspendableBalance = config.unspendableBalance;
    this.feeData = config.feeData;
    this.txWebUrl = config.txWebUrl;

    this.network = config.network;
    this.chainId = config.chainId;

    this.denom = config.denom;

    this.atomicId = config.atomicId;

    this.BN = BN;
    this.fields = {};
    this.plugins = [];
    this.explorers = [];
    this.transactions = [];

    this.confirmed = true;

    // this.plugins = [new DomainsPlugin()];

    this.txNotifier = new TxNotifier(this);
    this.features =
      config.features ??
      (config.coinData?.features as string[] | undefined) ??
      [];

    // @TODO handle
    // `TypeError: attempted to set private field on non-instance`
    // on calling:
    // this.setFeeData(config.feeData)

    this.manageSocket();
    this.manageEvents();
  }

  async loadLib(name: string): Promise<unknown> {
    try {
      // @ts-expect-error @TODO define types
      return await this.dependencies[name].get();
    } catch (error) {
      console.error(
        `[${this.id}] Error: Could not load "${name}" dependency`,
        error,
      );
      throw error;
    }
  }

  protected set id(id: string) {
    this.#id = id;
  }

  get id() {
    return this.#id;
  }

  protected set address(address: string) {
    this.#address = address;
  }

  get address() {
    return this.#address;
  }

  protected get derivation() {
    return this.#derivation;
  }

  protected set derivation(derivation) {
    this.#derivation = derivation;
  }

  get deprecatedParent() {
    return this.id;
  }

  get isCustomTokenSupported() {
    return (
      WALLETS_WITH_CUSTOM_TOKENS.includes(this.id) ||
      this.isFeatureSupported(CoinFeature.CustomTokens)
    );
  }

  /**
   * Get fee wallet instance
   * @return {Coin | Token}
   */
  get feeWallet() {
    return this;
  }

  /**
   * Don't use it! Use the wallet itself, you don't need `instance`.
   * @private
   * @deprecated
   */
  get instance() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const wallet = this;

    return {
      // getters are used to make this object up-to-date when wallet settings are changed
      get id() {
        return wallet.id;
      },
      get ticker() {
        return wallet.ticker;
      },
      get chainId() {
        return wallet.chainId;
      },
      get name() {
        return wallet.name;
      },
      get alias() {
        return wallet.alias;
      },
      get assetName() {
        return wallet.assetName;
      },
      get decimal() {
        return wallet.decimal;
      },
      get parent() {
        return wallet.id;
      },
      get feeCoefficient() {
        return wallet.coefficient;
      },
      get feeDefault() {
        return wallet.feeData?.fee;
      },
      get reserveForStake() {
        return wallet.feeData?.reserveForStake;
      },
      get gasLimit() {
        return wallet.gasLimit;
      },
      get address() {
        return wallet.address;
      },
      get account() {
        return wallet.address;
      },
      get coreLibrary() {
        return wallet.coreLibrary;
      },
      get coreLib() {
        return wallet.coreLib;
      },
      get denom() {
        return wallet.denom;
      },
      get feeTRC20() {
        return wallet.feeData?.feeTRC20;
      },
      get l2Name() {
        return wallet.l2Name;
      },
      get atomicId() {
        return wallet.atomicId;
      },
      feeDenom: () => this.feeDenom,
      getTickerFromDenom: (value: string) => this.getTickerFromDenom(value),
      isTestnet: () => this.isTestnet,
      toCurrencyUnit: (value: string) => this.toCurrencyUnit(value),
      toMinimalUnit: (value: string) => this.toMinimalUnit(value),
      getClient: () => this.getClient?.(),
      tokens: () => this.tokens,
      getFee: (feeObject: unknown) => this.getFee(feeObject),
      getTokens: () => this.tokens,
      getProvider: (usedFor: string) => this.getProvider(usedFor),
      getTRC20Fee: (feeTRC20Object: unknown) =>
        this.getTRC20Fee(feeTRC20Object),
      BN,
    };
  }

  /**
   * The active explorer getter.
   *
   * @return {Explorer} The instance of explorer
   */
  get explorer() {
    return this.explorers[0];
  }

  /**
   * Get private keys object
   * @return { Object } contains custom keys depended on chain or just private key
   */
  get privateKeysObject() {
    return this.KeysObject || false;
  }

  /**
   * Set private keys object
   * @param { Object } privateKeysObject
   */
  set privateKeysObject(privateKeysObject) {
    this.KeysObject = privateKeysObject;
  }

  setExplorersModules(explorerModules: Explorer[]) {
    explorerModules.forEach((explorer) => {
      this.explorersModules[explorer.name] = explorer;
    });
  }

  /**
   * Define whether the network fee is dynamic
   * @return {boolean} true if the network fee is dynamic
   */
  isFeeDynamic() {
    return false;
  }

  /**
   * Transaction id URL
   * @param id
   * @return {string}
   */
  getWebTransactionUrl(id: string) {
    return `${this.txWebUrl}${id}`;
  }

  manageSocket() {
    TxEventTypes.forEach((event) => {
      this.eventEmitter.on(
        event,
        async ({ ticker, address, hash, transaction }): Promise<void> => {
          if (this.ticker === ticker) {
            if (transaction !== undefined) {
              return this.txNotifier.notify(
                event,
                {
                  amount: this.toCurrencyUnit(String(transaction.amount)),
                  direction:
                    this.address.toLowerCase() === transaction.to.toLowerCase(),
                  txid: hash,
                },
                this.id,
                this.ticker,
                hash,
              );
            }

            let scriptPubKey;

            if (typeof this.getScriptPubKey === 'function') {
              try {
                scriptPubKey = await this.getScriptPubKey();
              } catch (error) {
                console.warn(error);
              }
            }

            const explorer = this.getProvider?.('socket') ?? this.explorer;

            if (typeof explorer?.getSocketTransaction !== 'function') {
              throw new UndeclaredAbstractMethodError(
                'getSocketTransaction',
                explorer,
              );
            }

            void explorer.getSocketTransaction({
              address,
              hash,
              scriptPubKey,
              tokens: this.tokens,
              type: event,
            });
          }
        },
      );
    });
  }

  manageEvents() {
    this.eventEmitter.on(`update::${this.id}::balance`, (balance) => {
      if (balance) {
        this.balance = balance;
      } else {
        this.getInfo();
      }
    });

    this.eventEmitter.on(`update::${this.ticker}::token`, (id) => {
      this.eventEmitter.emit('update::balance', id);
    });

    this.eventEmitter.on(
      `${this.id}-${this.id}::new-socket-tx`,
      ({ unconfirmedBalance = undefined, unconfirmedTx = undefined }) => {
        if (unconfirmedBalance) {
          this.balance = unconfirmedBalance;
        }

        if (unconfirmedTx && unconfirmedTx.direction) {
          this.eventEmitter.emit('socket::newtx', {
            id: this.id,
            ticker: this.ticker,
            amount: unconfirmedTx.amount,
            txid: unconfirmedTx.txid,
          });
        } else {
          this.eventEmitter.emit('socket::newtx::outgoing', {
            id: this.id,
            ticker: this.ticker,
          });
        }
      },
    );

    this.eventEmitter.on(
      `${this.id}::new-token-tx`,
      ({ token, unconfirmedTx }) => {
        const { ticker, id } = token;

        if (unconfirmedTx && unconfirmedTx.direction) {
          this.eventEmitter.emit('socket::newtx', {
            id,
            ticker,
            amount: unconfirmedTx.amount,
            txid: unconfirmedTx.txid,
          });
        } else {
          this.eventEmitter.emit('socket::newtx::outgoing', { id, ticker });
        }
      },
    );

    this.eventEmitter.on(
      `${this.ticker}::confirmed-socket-tx`,
      (walletId, tx) => this.onConfirmSocketTx(tx),
    );
  }

  /**
   * Processes a new tx got from the socket (does nothing by default)
   *
   * @param {Object} tx The transaction data
   */
  onConfirmSocketTx(tx: object) {}

  /**
   * Gets the fee.
   *
   * @param {string} amount Amount to transfer in minimal quantum (satoshi, drops and etc)
   * @param {boolean} isSendAll
   *
   * @return {BN} The fee big number
   */
  async getFee(args?: unknown): Promise<BN> {
    return new this.BN(this.fee || 0);
  }

  /**
   * Gets the address.
   *
   * @return {String} Public key
   */
  getAddress() {
    throw new UndeclaredAbstractMethodError('getAddress', this);
  }

  /**
   * Sets the public key.
   *
   * @param {String} address The public key string
   */
  setAddress(address: string) {
    this.address = address;
  }

  /**
   * Sets the private key.
   *
   * @param {String} privateKey The private key WIF
   * @param {String} mnemonic
   */
  async setPrivateKey(privateKey: string, mnemonic?: string) {
    throw new UndeclaredAbstractMethodError('async setPrivateKey', this);
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address: string) {
    throw new UndeclaredAbstractMethodError('validateAddress', this);
  }

  /**
   * Gets the wallet.
   *
   * @param {String} mnemonic The mnemonic phrase.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed?: Buffer, mnemonic?: string): Promise<string | object> {
    throw new UndeclaredAbstractMethodError('async loadWallet', this);
  }

  // @TODO txInfo type set to `any` until explorer types is not defined
  async checkTransaction(txInfo: any) {
    try {
      await this.explorer.checkTransaction(this.address, txInfo);
    } catch (error) {
      console.warn(this.ticker, 'Unable to check transaction');
    }

    this.eventEmitter.emit('socket::newtx::outgoing', {
      id: this.id,
      ticker: txInfo.coin.ticker,
    });

    setTimeout(async () => {
      await this.getBalance();
    }, CHECK_TX_UPDATE_TIMEOUT);
  }

  /**
   * Gets the information about a wallet.
   */
  async getInfo(): Promise<{ balance: string | null; nonce?: Numeric | null }> {
    try {
      if (!this.explorer) {
        return { balance: this.balance };
      }

      const { balance = null, nonce = null } = (await this.explorer.getInfo(
        this.address,
      )) as { balance?: string | null; nonce: number | null };

      if (balance) {
        this.balance = balance;
      }

      if (nonce) {
        this.nonce = Number(nonce);
      }

      return { balance: this.balance, nonce: this.nonce || null };
    } catch (error) {
      return { balance: this.balance };
    }
  }

  /**
   * Gets the balance.
   *
   * @return {Promise<BN>} The balance.
   */
  async getBalance() {
    const { balance } = await this.getInfo();

    this.balance = balance;

    return balance;
  }

  /**
   * Gets the transactions.
   *
   * @return {Promise<Object[]>} The transactions.
   *
   */
  // @TODO `any` until explorer types is not defined
  async getTransactions(args: any) {
    if (this.explorer) {
      if (!this.address) {
        throw new Error(
          `[${this.ticker}] getTransactions error: address is not loaded`,
        );
      }
      const txs = await this.explorer
        .getTransactions({ ...args, address: this.address })
        .catch((error) => {
          throw new ExplorerRequestError({
            type: GET_TRANSACTIONS_TYPE,
            error,
            instance: this,
          });
        });

      return txs;
    }

    return this.transactions;
  }

  /**
   * Return available balance for send
   *
   * @return {Promise<string>}
   */
  async availableBalance(fees: any) {
    // @ts-ignore
    const balance =
      (this.balances?.available &&
        this.toMinimalUnit(this.balances?.available)) ||
      this.balance;

    if (!balance) {
      return '';
    }

    const maximumFee =
      (fees && new this.BN(fees)) || new this.BN(await this.getFee());
    const availableBalance = new this.BN(balance)
      .sub(maximumFee)
      .sub(new this.BN(this.unspendableBalance));

    if (new this.BN(availableBalance).lt(new this.BN(0))) {
      return '0';
    }

    return this.toCurrencyUnit(availableBalance);
  }

  /**
   * Check amount + fee < balance
   *
   * @param {string} amount
   * @param {string} fee
   * @return {Promise<*>}
   */
  async isAvailableForSend(amount: string, fee: string) {
    // @ TODO empty string is always true
    if (Number(amount) < 0) {
      return false;
    }

    // is the balance still undefined then return false
    if (!this.balance) {
      return false;
    }

    const satoshiFee = fee ? this.toMinimalUnit(fee) : undefined;
    const availableBalance = new this.BN(
      this.toMinimalUnit(await this.availableBalance(satoshiFee)),
    );
    const amountToSpend = new this.BN(this.toMinimalUnit(amount));

    if (amountToSpend.isZero() && availableBalance.isZero()) {
      return false;
    }

    return amountToSpend.lte(availableBalance);
  }

  // @TODO define Explorer types
  createExplorer(config: any) {
    /**
     * @TODO Remove after fixing moralis class name
     */
    const moralisHack =
      config.className === 'ETHNftMoralisExplorer' ? 'MoralisExplorer' : '';

    const ExplorerModule =
      this.explorersModules[config.className] ??
      this.explorersModules[moralisHack];

    if (!ExplorerModule) {
      throw new ExternalError({
        error: `Could't create explorer instance: class ${config.className} not found`,
        instance: this,
      });
    }

    // @ts-ignore
    const explorer = new ExplorerModule({ wallet: this.instance, config });

    this.explorers.push(explorer);

    return explorer;
  }

  processExplorerConfig(config: any) {
    const explorer =
      this.explorers.find((item) => isEqual(config, item.config)) ??
      this.createExplorer(config);

    if (!explorer) {
      return null;
    }

    explorer.updateParams(config);
    return explorer;
  }

  /**
   * Process config feeData.
   *
   * @protected
   * @param {Object} [feeData] feeData
   */
  setFeeData(feeData = {}) {
    this.feeData = feeData;
    Object.entries(feeData).forEach(([key, value]) => {
      // @ts-ignore
      if (
        typeof this[key] !== 'undefined' &&
        typeof value !== 'undefined' &&
        key !== '__proto__'
      ) {
        // @ts-ignore
        this[key] = value;
      }
    });
  }

  updateConfigValue<K extends keyof CoinConfigType>(
    key: K,
    value: CoinConfigType[K],
  ) {
    this.config[key] = value;
  }

  /**
   * Update dynamic data set
   *
   * @param {Object} data The data
   */
  updateCoinParamsFromServer(data: CoinConfigType) {
    if (this.config === data) {
      return;
    }

    Object.keys(data).forEach((key) => {
      const value = data[key as keyof CoinConfigType];

      this.updateConfigValue(key as keyof CoinConfigType, value);
    });

    this.setFeeData(data.feeData);
    this.loadExplorers(data);
  }

  install() {
    this.plugins.forEach((plugin) => {
      // @ts-expect-error
      plugin.install(this);
    });
  }

  /**
   * Process explorers configuration.
   *
   * @protected
   * @param {Object} config
   */
  // @ts-expect-error @TODO define types
  loadExplorers({ explorers, txWebUrl, submitUrl }) {
    explorers.forEach((exData: any) => {
      try {
        this.processExplorerConfig({
          ...exData,
          submitUrl,
          webUrl: txWebUrl,
        });
      } catch (error) {
        // logger.error({ instance: this, error });
      }
    });
  }

  /**
   * Gets the unspent transaction outputs.
   *
   * @return {Promise<Object[]>} The unspent transaction outputs array
   */
  async getUnspentOutputs() {
    let scriptPubKey;

    if (typeof this.getScriptPubKey === 'function') {
      scriptPubKey = await this.getScriptPubKey();
    }

    return (
      this.explorer &&
      this.explorer.getUnspentOutputs(this.address, scriptPubKey)
    );
  }

  createTokenTransactionOnce(params: any) {
    return this.canRun('createTokenTransaction')
      ? this.createTokenTransaction(params)
      : {};
  }

  /**
   * isActivated getter
   * Allows to determine if a coin is activated.
   *
   * @returns {boolean}
   */
  get isActivated() {
    // return activeWalletsList.isActive(this);
  }

  /**
   * Activates coin
   * Also activates all associated tokens.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    // activeWalletsList.activate(this);
  }

  /**
   * Deactivates coin
   * Also deactivates all associated tokens.
   *
   * @returns {void}
   */
  deactivate() {
    // activeWalletsList.deactivate(this);
  }

  /**
   * Is feature supported by this coin network.
   */
  isFeatureSupported(feature: CoinFeature): boolean {
    if (!Object.values(CoinFeature).includes(feature)) {
      throw new Error(
        `Feature '${feature}' does not exist in the CoinFeature enum`,
      );
    }

    return this.features.includes(feature);
  }

  /**
   * Is NFT supported by this coin network.
   *
   * @deprecated - Use isFeatureSupported method instead.
   */
  isNftSupported(): boolean {
    return this.isFeatureSupported(CoinFeature.Nft);
  }
}

export default Coin;
