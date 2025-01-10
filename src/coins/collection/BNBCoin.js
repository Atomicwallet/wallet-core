import { Coin } from 'src/abstract';
import { DEFAULT_BINANCE_NET_URL } from 'src/env';
import { WalletError } from 'src/errors';
import BinanceBCExplorer from 'src/explorers/collection/BinanceBCExplorer';
import BinanceDex from 'src/explorers/collection/BinanceDex';
import BinanceExplorer from 'src/explorers/collection/BinanceExplorer';
import { BNBToken } from 'src/tokens';
import { Amount, LazyLoadedLib } from 'src/utils';
import { SEND_TRANSACTION_TYPE } from 'src/utils/const';

// import configManager, { ConfigKey } from '../ConfigManager';
import { HasProviders, HasTokensMixin, StakingMixin } from '../mixins';

const NAME = 'BNB Coin';
const TICKER = 'BNB';
const DERIVATION = undefined; // used lib hard-coded derivation
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

const HEXADECIMAL = 16;
const DEFAULT_TIMEINFORCE = 3;

const DEFAULT_RESERVE_AND_FREEZE_FEE = '500000';
const BINANCE_SDK = 'binanceSdk';

/**
 * Class for binance coin.
 *
 * @class BNBCoin
 */
class BNBCoin extends StakingMixin(HasProviders(HasTokensMixin(Coin))) {
  #privateKey;

  /**
   * @typedef {import('@binance-chain/javascript-sdk').BncClient} BncClient
   */

  /** @type {BncClient|null} */
  bncClient = null;
  isBncClientInitialized = false;

  /**
   * Сreates an instance of BNBCoin.
   * @param {*} alias
   * @param {*} feeData
   * @param {*} explorers
   * @param {*} txWebUrl
   * @memberof BNBCoin
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      explorers,
      txWebUrl,
      socket,
      feeData,
      dependencies: {
        [BINANCE_SDK]: new LazyLoadedLib(() => import('@binance-chain/javascript-sdk')),
      },
    };

    super(config);

    this.setExplorersModules([BinanceExplorer, BinanceBCExplorer, BinanceDex]);

    this.loadExplorers(config);

    this.derivation = DERIVATION;

    this.fee = feeData.fee;
    this.freezeFee = feeData.freezeFee || DEFAULT_RESERVE_AND_FREEZE_FEE;
    this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_AND_FREEZE_FEE;
    this.transactions = [];

    this.tokens = {};
    this.fields.paymentId = true;
  }

  /**
   * Inits and gets Binance client
   * @returns {Promise<BncClient>}
   */
  async getBncClient() {
    if (!this.bncClient) {
      const { BncClient } = await this.loadLib(BINANCE_SDK);
      const bncClient = new BncClient(DEFAULT_BINANCE_NET_URL);

      bncClient.chooseNetwork('mainnet');

      this.bncClient = bncClient;
    }

    return this.bncClient;
  }

  /**
   * Inits bncClient
   * @param {BncClient} bncClient
   * @returns {Promise<void>}
   */
  async initBncClient(bncClient) {
    if (this.isBncClientInitialized) {
      return;
    }

    try {
      await bncClient.initChain();
      await bncClient.setPrivateKey(this.#privateKey);
      this.isBncClientInitialized = true;
    } catch (error) {
      console.warn(
        'BNB coreLibrary load FAILED. It would be attempt to re-initialize during each sendTransaction call. ' +
          'Error thrown:',
        error,
      );
    }
  }

  /**
   * Gets initialized bncClient
   * @returns {Promise<BncClient>}
   */
  async getInitializedBncClient() {
    const bncClient = await this.getBncClient();

    await this.initBncClient(bncClient);
    return bncClient;
  }

  freezeTokenBalanceOnce(params) {
    return this.canRun('freezeTokenBalance') && this.freezeTokenBalance ? this.freezeTokenBalance(params) : {};
  }

  unfreezeTokenBalanceOnce(params) {
    return this.canRun('unfreezeTokenBalance') && this.unfreezeTokenBalance ? this.unfreezeTokenBalance(params) : {};
  }

  /**
   * BNB user tokens request often takes >1 minute so skip await and don't block UI
   */
  get shouldSkipTokensFetchAwait() {
    return true;
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed, mnemonic) {
    const [bncClient, { crypto }] = await Promise.all([this.getBncClient(), this.loadLib(BINANCE_SDK)]);

    this.#privateKey = crypto.getPrivateKeyFromMnemonic(mnemonic);
    this.address = crypto.getAddressFromPrivateKey(this.#privateKey, bncClient.addressPrefix);

    this.initBncClient(bncClient);

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Gets the transaction info.
   *
   * @param {String} txId The transaction identifier.
   * @return {Promise<Object>} The transaction.
   */
  async getTransaction(txId) {
    const txFilteredArray = this.transactions.filter((tx) => tx.txid === txId);

    return txFilteredArray.length > 0 ? txFilteredArray[0] : {};
  }

  /**
   * Gets the public key.
   *
   * @return {String} The public key hex string.
   */
  async getPublicKey() {
    const { crypto } = await this.loadLib(BINANCE_SDK);

    return crypto.getPublicKeyFromPrivateKey(this.#privateKey);
  }

  /**
   * The address getter
   *
   * @return {string} { description_of_the_return_value }
   * @throws
   */
  async getAddress() {
    if (!this.#privateKey) {
      throw new Error('BNB: Could not load address from core library because the privateKey is not set');
    }

    if (!this.address) {
      const { crypto } = await this.loadLib(BINANCE_SDK);

      this.address = crypto.getAddressFromPrivateKey(this.#privateKey);
    }
    return this.address;
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    const { crypto } = await this.loadLib(BINANCE_SDK);

    return crypto.checkAddress(address, 'bnb');
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @param {String} asset Asset to send
   * @return {Object} Raw transaction
   */
  async createTransaction({ address, amount, memo, asset = 'BNB' }) {
    return { address, amount, memo, asset };
  }

  createDelegationTransaction({ account, toValidator, amount, symbol = 'BNB', sideChainId = 'bsc' }) {
    return {
      delegateAddress: account,
      validatorAddress: toValidator,
      amount,
      symbol,
      sideChainId,
    };
  }

  createUnDelegationTransaction({ account, toValidator, amount, symbol = 'BNB', sideChainId = 'bsc' }) {
    return {
      delegateAddress: account,
      validatorAddress: toValidator,
      amount,
      symbol,
      sideChainId,
    };
  }

  createReDelegationTransaction({ account, fromValidator, toValidator, amount, symbol = 'BNB', sideChainId = 'bsc' }) {
    return {
      delegateAddress: account,
      validatorSrcAddress: fromValidator,
      validatorDstAddress: toValidator,
      amount,
      symbol,
      sideChainId,
    };
  }

  async sendDelegationTransaction(delegationTx) {
    const bncClient = await this.getInitializedBncClient();
    const { status, result } = await bncClient.stake.bscDelegate(delegationTx);

    if (status !== 200) {
      throw new Error(`${this.ticker}: sendDelegationTransaction error: ${JSON.stringify(result)}`);
    }

    const firstTransfer = result[0];

    if (!firstTransfer.ok) {
      throw new Error(`BNB: asset (${this.ticker}) : sendDelegationTransaction error:
        coreLib.transfer is not ok, got: ${JSON.stringify(result)}`);
    }

    return {
      txid: firstTransfer.hash,
    };
  }

  async sendUnDelegationTransaction(unDelegationTx) {
    const bncClient = await this.getInitializedBncClient();
    const { status, result } = await bncClient.stake.bscUndelegate(unDelegationTx);

    if (status !== 200) {
      throw new Error(`${this.ticker}: sendUnDelegationTransaction error: ${JSON.stringify(result)}`);
    }

    const firstTransfer = result[0];

    if (!firstTransfer.ok) {
      throw new Error(`BNB: asset (${this.ticker}) : sendUnDelegationTransaction error:
        coreLib.transfer is not ok, got: ${JSON.stringify(result)}`);
    }

    return {
      txid: firstTransfer.hash,
    };
  }

  async sendReDelegationTransaction(reDelegationTx) {
    const bncClient = await this.getInitializedBncClient();

    return bncClient.stake.bscReDelegate(reDelegationTx);
  }

  async createTokenTransaction(args) {
    return args;
  }

  /**
   * Signing an order
   *
   * @param  {<type>} order The order
   * @return {Promise} { description_of_the_return_value }
   */
  async signOrder(order) {
    const { crypto } = await this.loadLib(BINANCE_SDK);

    return crypto.generateSignature(this.toHex(JSON.stringify(order)), this.#privateKey).toString('hex');
  }

  /**
   * Converting string to HEX
   *
   * @param  {string} string The string
   * @return {string} { description_of_the_return_value }
   */
  toHex(string) {
    let result = '';

    for (let idx = 0; idx < string.length; idx += 1) {
      const hex = string.charCodeAt(idx).toString(HEXADECIMAL);

      result += hex;
    }

    return result;
  }

  /**
   * @return {Promise<BN>}
   */
  async getFee() {
    return new this.BN(this.fee);
  }

  /**
   * @return {Promise<BN>}
   */
  async getFreezeFee() {
    return new this.BN(this.freezeFee);
  }

  /**
   * Calls for getBalance, does not calls for getTransactions
   *
   * @returns
   * @memberof BNBCoin
   */
  async getInfo() {
    await this.getBalance();
    await this.getStakingInfo();

    return {
      balance: this.balance,
      balances: this.balances,
      transactions: [],
    };
  }

  /**
   * Get balance for BNB and assets
   *
   * @return {Promise<BN>}
   */
  async getBalance() {
    const balances = await this.getProvider('balance').getBalance(this.address);

    if (!balances) {
      return this.balance;
    }

    for (const token of Object.values(this.tokens)) {
      const assetBalance = balances.find((balance) => balance.asset === token.ticker);

      const total = assetBalance
        ? new this.BN(token.toMinimalUnit(assetBalance.free))
            .add(new this.BN(token.toMinimalUnit(assetBalance.frozen)))
            .add(new this.BN(token.toMinimalUnit(assetBalance.locked)))
        : '0';

      token.balance = total.toString();
      token.balances.frozen = assetBalance ? String(assetBalance.frozen) : '0';
      token.balances.locked = assetBalance ? String(assetBalance.locked) : '0';
      token.balances.available = assetBalance ? String(assetBalance.free) : token.divisibleBalance;
    }

    const coinBalance = balances.find((balance) => balance.asset === this.ticker);

    if (!coinBalance) {
      this.balance = '0';
      return this.balance;
    }

    this.balance = this.toMinimalUnit(coinBalance.free);
    return this.balance;
  }

  /**
   * Sends a transaction.
   *
   * @param {String} rawtx The rawtx
   * @return {Promise<Object>} The transaction data
   */
  async sendTransaction({ address, amount, memo, asset = 'BNB' }) {
    const from = this.address;
    const currencyUnitAmount = this.toCurrencyUnit(amount);

    const bncClient = await this.getInitializedBncClient();
    const { result, status } = await bncClient.transfer(from, address, currencyUnitAmount, asset, memo);

    if (status !== 200) {
      throw new Error(`${this.ticker}: sendTransaction error: ${JSON.stringify(result)}`);
    }

    const firstTransfer = result[0];

    if (!firstTransfer.ok) {
      throw new Error(`BNB: asset (${asset}) : sendTransaction error:
        coreLib.transfer is not ok, got: ${JSON.stringify(result)}`);
    }

    return {
      txid: firstTransfer.hash,
    };
  }

  async sendMultiTransaction(outputs) {
    const bncClient = await this.getInitializedBncClient();
    const { result, status } = await bncClient.multiSend(this.address, outputs);

    if (status !== 200) {
      throw new Error(`${this.ticker}: sendTransaction error: ${JSON.stringify(result)}`);
    }

    const firstTransfer = result[0];

    if (!firstTransfer.ok) {
      throw new Error(`BNB: sendTransaction error:
        coreLib.transfer is not ok, got: ${JSON.stringify(result)}`);
    }

    return {
      txid: firstTransfer.hash,
    };
  }

  async placeOrder(
    quantity,
    price,
    side = 1,
    address = this.address,
    pairSymbol = 'AWC-986_BNB',
    sequence = null,
    timeInforce = DEFAULT_TIMEINFORCE,
  ) {
    const bncClient = await this.getInitializedBncClient();

    return bncClient.placeOrder(address, pairSymbol, side, price, quantity, sequence, timeInforce).catch((error) => {
      throw new WalletError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(`place Order failed: ${error.message}`),
        instance: this,
      });
    });
  }

  async getPlaceOrderTx(hash) {
    const bncClient = await this.getInitializedBncClient();

    return bncClient.getTx(hash).catch((error) => {
      throw new WalletError({
        type: 'GetTx',
        error: new Error(`get tx failed: ${error.message}`),
        instance: this,
      });
    });
  }

  /**
   * Sets the private key.
   *
   * @param {string} privateKey The private key
   * @returns {Promise<void>}
   */
  async setPrivateKey(privateKey) {
    this.#privateKey = privateKey;

    await this.initClientKey(privateKey);
  }

  async initClientKey(privateKey) {
    const bncClient = await this.getBncClient();

    return bncClient.setPrivateKey(privateKey);
  }

  /**
   * Creates a token.
   *
   * @param {...Array} args The arguments
   * @return {BNBToken}
   */
  createToken(args) {
    return new BNBToken({ parent: this, ...args });
  }

  async getTokenList() {
    return []; // configManager.get(ConfigKey.BnbTokens);
  }

  /**
   * Fetches user token list from a coreLibrary.getBalance call
   *
   * @returns {Promise<Array<ServerToken>>} - list of the tokens that a user
   * have
   * @memberof BNBCoin
   */
  async getUserTokenList() {
    const bncClient = await this.getBncClient();
    const userBalances = await bncClient.getBalance(this.address);

    if (!userBalances) {
      return [];
    }

    const userTokens = userBalances
      .map((balance) => balance.symbol)
      .filter((ticker) => ticker.toLowerCase() !== this.ticker.toLowerCase());

    return this.getProvider('node').getTokenList(userTokens);
  }

  /**
   * Returns list of tickers for excluded tokens. BNB filter prevents double
   * creation of BNB asset (first is coin, second is token)
   *
   * @returns
   * @memberof BNBCoin
   */
  getExcludedTokenList() {
    return ['BNB'];
  }

  /**
   * Fetches transactions from the binance Explorer
   *
   * @param {*} [asset=TICKER] or symbol - binance symbol of a token (ticker)
   * @returns a list of transaction objects
   * @memberof BNBCoin
   */
  async getTransactions({ address = this.address } = {}) {
    const { transactions = [] } = await this.getProvider('history').getTransactions({ address });
    /* Multisend OFF
    const { transactions = [], multisend = [] } = await this.getProvider('history').getTransactions({ address })

     let multisendTxs = []

     try {
       multisendTxs = await this.getProvider('multisendTxs').getMultisendTransactions(address, multisend)
     } catch (error) {
       console.warn('GetMultisendTxsError')
     }
    return transactions.concat(multisendTxs)
    */

    return transactions;
  }

  /**
   * Converts serverToken to internal token format
   *
   * @param {*} serverTokenObject
   * @param {*} source
   * @returns
   * @memberof BNBCoin
   */
  getTokenObject(serverTokenObject, source) {
    return {
      contract: serverTokenObject.owner,
      name: serverTokenObject.name,
      ticker: serverTokenObject.symbol,
      decimal: DECIMAL,
      parentTicker: TICKER,
      uniqueField: serverTokenObject.symbol,
      confirmed: serverTokenObject.confirmed,
      notify: Boolean(serverTokenObject.notify),
    };
  }

  /**
   * Freeze provided amount of token
   *
   * @param tokenTicker
   * @param amount in currency units, not satoshis
   * @return {Promise<*>}
   */
  async freezeTokenBalance(tokenTicker, amount) {
    const bncClient = await this.getInitializedBncClient();
    const frozen = await bncClient.tokens.freeze(this.address, tokenTicker, String(amount));

    if (frozen.result && frozen.result.length > 0) {
      return frozen.result[0].hash;
    }

    if (frozen.status !== 200) {
      throw new WalletError({
        type: 'Freeze amount',
        error: new Error(`Freeze amount for ${tokenTicker} is failed: ${frozen.error}`),
        instance: this,
      });
    }

    return frozen;
  }

  /**
   *
   * @param tokenTicker
   * @param amount in currency unit, not satoshis
   * @return {Promise<*>}
   */
  async unfreezeTokenBalance(tokenTicker, amount) {
    const bncClient = await this.getInitializedBncClient();
    const unfrozen = await bncClient.tokens.unfreeze(this.address, tokenTicker, String(amount));

    if (unfrozen.result && unfrozen.result.length > 0) {
      return unfrozen.result[0].hash;
    }

    if (unfrozen.status !== 200) {
      throw new WalletError({
        type: 'Freeze amount',
        error: new Error(`Unfreeze amount for ${tokenTicker} is failed: ${unfrozen.error}`),
        instance: this,
      });
    }

    return unfrozen;
  }

  async connectSocket() {
    this.getProvider('socket').connectSocket(this.address);
  }

  async updateBalances(assets) {
    const tokens = Object.values(this.tokens);

    assets.forEach((balance) => {
      const asset = balance.a;

      if (asset === 'BNB') {
        this.balance = this.toMinimalUnit(balance.f);
        return;
      }

      const token = tokens.find((tkn) => tkn.ticker === asset);

      if (!token) {
        console.warn(`${asset} is not found in the BNB token list. Balance update skipped.`);
        return;
      }

      const free = balance.f;
      const locked = balance.l;
      const frozen = balance.r;

      const total = new this.BN(token.toMinimalUnit(free))
        .add(new this.BN(token.toMinimalUnit(frozen)))
        .add(new this.BN(token.toMinimalUnit(locked)));

      token.balance = total.toString();
      token.balances.frozen = frozen;
      token.balances.locked = locked;
      token.balances.available = free;
    });
  }

  async availableBalance(fees) {
    const balance = this.balance;

    if (!balance) {
      return null;
    }

    const maximumFee = (fees && new this.BN(fees)) || (await this.getFee());
    const availableBalance = new this.BN(balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));

    if (new this.BN(availableBalance).lt(new this.BN(0))) {
      return '0';
    }

    return this.toCurrencyUnit(availableBalance);
  }

  calculateTotal({ balance, staked, unstaking }) {
    return new Amount(balance.toBN().add(staked.toBN()).add(unstaking.toBN()).toString(), this);
  }

  async calculateAvailableForStake() {
    const available = new this.BN(this.toMinimalUnit(await this.availableBalance())).sub(
      new this.BN(this.reserveForStake),
    );

    return new Amount(available.isNeg() ? '0' : available, this);
  }
}

export default BNBCoin;
