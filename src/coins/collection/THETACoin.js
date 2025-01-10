// import logger from '../Logger';
import { Coin } from 'src/abstract';
import ThetaExplorer from 'src/explorers/collection/ThetaExplorer';
import ThetaJSExplorer from 'src/explorers/collection/ThetaJSExplorer';
import { THETAToken } from 'src/tokens';
import { LazyLoadedLib } from 'src/utils';

import { HasProviders, HasTokensMixin } from '../mixins';

const thetaJsLib = new LazyLoadedLib(() => import('@thetalabs/theta-js'));

/**
 * THETA blockchain consists of 2 assets:
 * - THETA is a blockchain native coin.
 * - TFUEL is a token which is used to pay network fees.
 */

const DERIVATION = "m/44'/500'/0'/0/";

const THETA_TICKER = 'THETA';
const TFUEL_TICKER = 'TFUEL';
const THETA_NAME = 'THETA Coin';
const TFUEL_NAME = 'THETA Fuel Coin';
const THETA_DECIMAL = 18;
const TFUEL_DECIMAL = 18;

const ADDRESS_PATTERN = /^(0x)?[0-9a-f]{40}$/i;

/**
 * @class THETACoin
 */
class THETACoin extends HasProviders(HasTokensMixin(Coin)) {
  #privateKey;
  #feeTokenWallet;

  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, network = THETA_TICKER, id }) {
    const config = {
      id,
      alias,
      notify,
      name: THETA_NAME,
      ticker: THETA_TICKER,
      decimal: THETA_DECIMAL,
      txWebUrl,
      explorers,
      socket,
      feeData,
      network,
    };

    super(config);

    this.setExplorersModules([ThetaExplorer, ThetaJSExplorer]);

    this.loadExplorers(config);

    this.derivation = DERIVATION;

    this.defaultFee = feeData.defaultFee;
    this.resendTimeout = feeData.resendTimeout;
    this.fields.paymentId = false;
    this.tokens = {};
    this.#initFeeTokenWallet();

    this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
      this.eventEmitter.emit('socket::tx::confirmed', { id: coinId, ticker });
    });
  }

  get feeWallet() {
    return this.#feeTokenWallet;
  }

  get feeTicker() {
    return this.#feeTokenWallet.ticker;
  }

  #initFeeTokenWallet() {
    this.#feeTokenWallet = this.createToken({
      name: TFUEL_NAME,
      ticker: TFUEL_TICKER,
      decimal: TFUEL_DECIMAL,
      visibility: true,
      confirmed: true,
      source: 'list',
    });
    this.tokens[this.#feeTokenWallet.id] = this.#feeTokenWallet;
  }

  async loadTokensList(wallets) {
    wallets.addWallet(this.#feeTokenWallet);
    this.eventEmitter.emit('update::coin-list');
  }

  createToken(args) {
    return new THETAToken({
      parent: this,
      ...args,
    });
  }

  getTokenList() {
    return [
      {
        id: this.#feeTokenWallet.id,
        name: this.#feeTokenWallet.name,
        ticker: this.#feeTokenWallet.ticker,
        decimal: this.#feeTokenWallet.decimal,
        visibility: this.#feeTokenWallet.visibility,
      },
    ];
  }

  async loadWallet(seed, phrase) {
    try {
      const { Wallet } = await thetaJsLib.get();
      const { address, privateKey } = Wallet.fromMnemonic(phrase);

      this.address = address;
      this.#privateKey = privateKey;
    } catch (error) {
      // logger.error({
      //   instance: this,
      //   error,
      // });
    }

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Validates wallet address
   *
   * @param {string} address
   * @return {boolean}
   */
  validateAddress(address) {
    return ADDRESS_PATTERN.test(address);
  }

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
  async createTransaction({ address, amount, nonce, ticker = this.ticker, userFee }) {
    const { provider } = this.getProvider('node');

    if (!provider) {
      throw new Error(`${this.ticker} set provider first`);
    }
    const { Wallet, transactions } = await thetaJsLib.get();

    const wallet = new Wallet(this.#privateKey, provider);

    return wallet.signTransaction(
      new transactions.SendTransaction({
        from: this.address,
        outputs: [
          {
            address,
            thetaWei: ticker === THETA_TICKER ? amount : '0',
            tfuelWei: ticker === TFUEL_TICKER ? amount : '0',
          },
        ],
        sequence: Number(nonce || (await this.updateNonce())),
        gasPrice: userFee || (await this.getFee()),
      }),
    );
  }

  async createTokenTransaction(payload) {
    if ([THETA_TICKER, TFUEL_TICKER].includes(payload.ticker)) {
      return this.createTransaction(payload);
    }

    throw new Error(`${this.ticker} adapter supports only TFUEL and THETA coins`);
  }

  async getTransactions(payload) {
    if (!this.address) {
      throw new Error(`${this.ticker} address not found`);
    }

    try {
      return this.getProvider('history').getTransactions({
        address: this.address,
        ...payload,
      });
    } catch (error) {
      // logger.error({
      //   instance: this,
      //   error,
      // });

      return [];
    }
  }

  /**
   * Get available balance for a passed wallet. Wallet can be the coin itself or any THETA token.
   * Don't use it if you don't know what you are doing! Use wallet.availableBalance() instead.
   *
   * @param {Object} wallet wallet to get available balance for
   * @param {string} fee user fee
   * @returns {Promise<string>}
   */
  async getAvailableBalanceForWallet(wallet, fee) {
    if (!wallet.balance) {
      return '0';
    }

    let availableBalance = new this.BN(wallet.balance);

    if (wallet.ticker === this.feeTicker) {
      availableBalance = availableBalance.sub(fee ? new this.BN(fee) : await wallet.getFee());
    }

    return availableBalance.gt(new this.BN(0)) ? this.toCurrencyUnit(availableBalance) : '0';
  }

  /**
   * Return available balance for send
   *
   * @return {Promise<string>} In currency units
   */
  async availableBalance(fee) {
    return this.getAvailableBalanceForWallet(this, fee);
  }

  async getInfo() {
    return this.updateInfo();
  }

  async setPrivateKey(privateKey, phrase) {
    const { Wallet } = await thetaJsLib.get();
    const { address } = new Wallet(privateKey);

    this.address = address;
    this.#privateKey = privateKey;
  }

  async checkTransaction(txInfo) {
    await super.checkTransaction({ feeTicker: this.feeTicker, ...txInfo });
  }

  async getBalance() {
    return (await this.getInfo()).balance;
  }

  async updateNonce() {
    return (await this.updateInfo()).nonce;
  }

  async updateInfo() {
    if (!this.address) {
      throw new Error(`${this.ticker} address not found`);
    }

    const { sequence, coins, emptyAddress } = await this.getProvider('node').getAccount(this.address);

    this.nonce = new this.BN(sequence).add(new this.BN(1));

    if (emptyAddress) {
      this.balance = '0';

      Object.values(this.tokens).forEach((token) => {
        token.balance = '0';
      });
    } else {
      Object.entries(coins).forEach(([ticker, amount]) => {
        if (ticker === this.ticker) {
          this.balance = amount;
        } else {
          this.tokens[ticker].balance = amount;
        }
      });
    }

    return {
      nonce: this.nonce.toString(),
      balance: this.balance,
    };
  }

  async getFee() {
    const fee = this.defaultFee[this.feeTicker.toLowerCase()];

    if (!fee) {
      throw new Error(`${this.ticker} provide defaultFee in config`);
    }

    return new this.BN(fee);
  }

  /**
   * Does fee wallet has enough balance to send transactions.
   *
   * @param {BN} [userFee] fee set by user, default fee is used if not argument is not passed or zero
   * @returns {Promise<boolean>}
   */
  async hasEnoughFeeBalance(userFee) {
    const fee = !userFee || userFee.isZero() ? await this.getFee() : userFee;

    return new this.BN(this.#feeTokenWallet.balance).gte(fee);
  }

  /**
   * Is this wallet available for sending transactions.
   *
   * @param {BN} [userFee] fee set by user
   * @returns {Promise<boolean>}
   */
  isAvailableForFee(userFee) {
    return this.hasEnoughFeeBalance(userFee);
  }
}

export default THETACoin;
