import BN from 'bn.js';
import { Coin } from 'src/abstract';
import { ExternalError } from 'src/errors';
import Web3Explorer from 'src/explorers/collection/Web3Explorer';
import { LazyLoadedLib } from 'src/utils';
import { EXTERNAL_ERROR } from 'src/utils/const';
import { isStartsWith } from 'src/utils/funcs';

import { HasProviders } from '../mixins';

const NAME = 'Filecoin';
const TICKER = 'FIL';
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const CHAIN_ID = 314;
const ETH_MODERATED_GAS_PRICE_URL = 'eth-gas-price';
const MODERATED_GAS_PRICE_URL_TIMEOUT = 10000;
const GWEI = 1000000000;

const MOCK_ETH_ADDR = '0xbdd5468D969e585E38B5a0EEADDb56D5B76814ff';
const DEFAULT_MAX_GAS = '6000000';

const WEB3_SDK = 'web3Sdk';
const ETHEREUM_JS_WALLET_SDK = 'ethereumJsWalletSdk';
const FILECOIN_ADDRESS_SDK = 'filecoinAddressSdk';

/**
 * @class ETHCoin
 */
class FILCoin extends HasProviders(Coin) {
  #privateKey;

  /** @type {string} */
  web3BaseUrl;
  /** @type {import('web3').default|null} */
  coreLibrary = null;

  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
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
      txWebUrl,
      explorers,
      socket,
      feeData,
      dependencies: {
        [WEB3_SDK]: new LazyLoadedLib(() => import('web3')),
        [ETHEREUM_JS_WALLET_SDK]: new LazyLoadedLib(() => import('ethereumjs-wallet')),
        [FILECOIN_ADDRESS_SDK]: new LazyLoadedLib(() => import('@glif/filecoin-address')),
      },
    };

    super(config);

    this.setExplorersModules([Web3Explorer]);

    this.loadExplorers(config);

    this.setFeeData(feeData);

    const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');

    this.web3 = new Web3Explorer({
      wallet: this.instance,
      config: { ...web3Params, webUrl: txWebUrl },
    });
    this.web3BaseUrl = web3Params.baseUrl;

    this.fields.paymentId = false;
    this.tokens = {};
    this.nonce = new this.BN('0');

    this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
      this.eventEmitter.emit('socket::tx::confirmed', { id: coinId, ticker });
    });
  }

  /**
   * Sets web3 instance to coreLibrary
   * @returns {Promise<void>}
   */
  async initCoreLibrary() {
    if (this.coreLibrary) {
      return;
    }

    const { default: Web3 } = await this.loadLib(WEB3_SDK);

    this.coreLibrary = new Web3(this.web3BaseUrl);
  }

  /**
   * Gets web3 instance
   * @returns {Promise<import('web3').default>}
   */
  async getCoreLibrary() {
    if (!this.coreLibrary) {
      await this.initCoreLibrary();
    }

    return this.coreLibrary;
  }

  /**
   * Gets Filecoin Address SDK
   * @async
   * @returns {Promise<(import('@glif/filecoin-address'))>}
   */
  getFilecoinAddressSdk() {
    return this.loadLib(FILECOIN_ADDRESS_SDK);
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.gasLimit = String(feeData.gasLimit);
    this.gasLimitCoefficient = feeData.gasLimitCoefficient;
  }

  isFeeDynamic() {
    return true;
  }

  async getTransactions() {
    if (!this.address) {
      throw new Error(`${TICKER}: getTransactions: address is not loaded`);
    }

    const {
      transactions = [],
      tokenTransactions = [],
      failed = [],
    } = await this.getProvider('history').getTransactions({
      address: this.address,
    });
    const failedTxs = await Promise.all(
      failed.map(({ txid }) => this.getProvider('history').getTransaction(this.address, txid, this.tokens)),
    );

    return transactions.concat(tokenTransactions).concat(failedTxs);
  }

  manageSocket() {
    this.eventEmitter.on('receive', async ({ address, hash, ticker }) => {
      if (this.ticker === ticker) {
        this.getProvider('socket').getSocketTransaction({
          address,
          hash,
          tokens: this.tokens,
          type: 'receive',
        });
      }
    });

    // confirmed transacion message received, balance update needed
    this.eventEmitter.on('confirm', async ({ address, hash, ticker }) => {
      if (this.ticker === ticker) {
        this.getProvider('socket').getSocketTransaction({
          address,
          hash,
          tokens: this.tokens,
          type: 'confirm',
        });
      }
    });
  }

  /**
   * Get ETH fee settings
   * @return {Promise<Object>} The ETH fee settings
   * @see {@link https://atomicwallet.atlassian.net/wiki/spaces/DevOps/pages/343638041#%D0%94%D0%B5%D1%84%D0%BE%D0%BB%D1%82%D0%BD%D0%B0%D1%8F-%D0%BA%D0%BE%D0%BC%D0%B8%D1%81%D1%81%D0%B8%D1%8F-%D0%B4%D0%BB%D1%8F-ETH}
   */
  getFeeSettings() {
    return {};
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<object>}
   */
  async loadWallet(seed) {
    const [coreLibrary, { hdkey }] = await Promise.all([this.getCoreLibrary(), this.loadLib(ETHEREUM_JS_WALLET_SDK)]);
    const ethHDKey = hdkey.fromMasterSeed(seed);
    const wallet = ethHDKey.getWallet();
    const account = coreLibrary.eth.accounts.privateKeyToAccount(wallet.getPrivateKeyString());

    if (!account) {
      throw new Error(`${this.wallet.ticker} can't get the wallet`);
    }

    this.#privateKey = account.privateKey;
    this.address = account.address;

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Validates wallet address
   *
   * @param {string} address The address
   * @return {Promise<boolean>}
   */
  async validateAddress(address) {
    const [coreLibrary, { validateAddressString }] = await Promise.all([
      this.getCoreLibrary(),
      this.getFilecoinAddressSdk(),
    ]);

    return isStartsWith(address, '0x') ? coreLibrary.utils.isAddress(address) : validateAddressString(address);
  }

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
  async createTransaction({ address, amount, paymentData = null, nonce, gasLimit = this.gasLimit }) {
    const [coreLibrary, { ethAddressFromDelegated }] = await Promise.all([
      this.getCoreLibrary(),
      this.getFilecoinAddressSdk(),
      this.getNonce(),
    ]);

    const transaction = {
      to: isStartsWith(address, '0x') ? address : ethAddressFromDelegated(address),
      value: amount,
      gas: gasLimit || this.gasLimit, // front may send "null"
      chainId: CHAIN_ID,
      nonce: nonce || this.nonce,
      type: 0x2,
    };

    if (paymentData !== '' && paymentData !== null) {
      transaction.data = paymentData;
    }

    const signedTx = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);

    return signedTx.rawTransaction;
  }

  /**
   * Send transacrion
   * @async
   * @param {string} rawtx
   * @returns {Promise<Transaction>}
   */
  sendTransaction(rawtx) {
    return this.getProvider('send').sendTransaction(rawtx);
  }

  /**
   * Gets max fee per gas from Eth Gas Station
   * For support EIP-1559 standard
   *
   * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas price.
   * @returns {Promise<string>}
   * @throws {ExternalError}
   */
  async getMaxFeePerGas(gasPriceCoefficient) {
    const { standard: standardPrice } = await this.getModerateGasPrice();

    if (!standardPrice) {
      throw new ExternalError({
        type: EXTERNAL_ERROR,
        error: 'Failed to get getMaxFeePerGas',
        instance: this,
      });
    }
    return standardPrice.mul(new BN(gasPriceCoefficient)).toString();
  }

  async getNonce() {
    const coreLibrary = await this.getCoreLibrary();

    this.nonce = new this.BN(await coreLibrary.eth.getTransactionCount(this.address));
    return this.nonce;
  }

  /**
   * Gets the fee.
   *
   * @param  {Number}  amount In satoshis
   * @param  {Boolean} isSendAll The is send all (default: false)
   * @return {Promise<BN>} The fee.
   */
  async getFee({ userGasPrice = null, gasLimit = null } = {}) {
    const gasPrice = userGasPrice || (await this.getGasPrice());

    return new BN(String(gasPrice)).mul(new this.BN(gasLimit || this.gasLimit));
  }

  async getGasPrice(withoutCoeff = false) {
    const moderatedGasPrice = await this.getModerateGasPrice();

    const { fastest = null, standard = null } = moderatedGasPrice?.fastest
      ? moderatedGasPrice
      : await this.getProvider('node').getGasPrice();

    if (withoutCoeff) {
      return standard || this.defaultGasPrice;
    }

    if (!fastest) {
      return this.defaultGasPrice;
    }

    const coeff = new this.BN(this.gasPriceCoefficient);
    const gasInCurrency = new this.BN(Number(fastest) / GWEI);

    const gasWithCoeff = gasInCurrency.add(coeff);

    return new this.BN(Number(gasWithCoeff) * GWEI);
  }

  /**
   * Gets moderate gas prices from Eth Gas station
   *
   * @returns {Promise<{standard: BN, fastest: BN} | {}>}
   */
  async getModerateGasPrice() {
    // @TODO implement external gas price fetcher / config

    return {};
  }

  async estimateGas(amount, address, contract, defaultGas = DEFAULT_MAX_GAS) {
    const tokenSendData = this.getProvider('send').createSendTokenContract(
      contract,
      this.address,
      MOCK_ETH_ADDR,
      amount,
    );

    const coreLibrary = await this.getCoreLibrary();
    const estimateGas = await coreLibrary.eth
      .estimateGas({
        from: this.address,
        nonce: Number(this.nonce.add(new this.BN(1))),
        to: contract,
        data: tokenSendData,
      })
      .catch(() => {});

    return estimateGas ? Math.round(estimateGas * this.gasLimitCoefficient).toString() : defaultGas;
  }

  /**
   * Return available balance for send
   *
   * @return {Promise<string>}
   */
  async availableBalance(fee) {
    if (!this.balance) {
      return null;
    }

    const maximumFee = (fee && new this.BN(fee)) || (await this.getFee());
    const availableBalance = new this.BN(this.balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));

    if (new this.BN(availableBalance).lt(new this.BN(0))) {
      return '0';
    }

    return this.toCurrencyUnit(availableBalance);
  }

  async getInfo(tokenInfo) {
    // @TODO Refactor using coreLibrary in the Web3Explorer
    // Core library is required in the Web3Explorer, which is obtained there from wallet.instance.
    // We need to make sure that the core Library is present and initialized.
    await this.initCoreLibrary();

    this.getNonce();

    if (tokenInfo && tokenInfo.isToken) {
      const tokenBalance = await this.getProvider('node').getTokenBalanceByContractAddress({
        address: this.address,
        contractAddress: tokenInfo.contract.toLowerCase(),
      });

      const contractVariant = [tokenInfo.contract, tokenInfo.contract.toLowerCase()];

      contractVariant.forEach((contract) => {
        if (this.tokens[contract]) {
          this.tokens[contract].balance = tokenBalance.toString();
        }
      });
    }

    const info = await this.getProvider('balance').getInfo(this.address);

    if (info && info.balance) {
      this.balance = info.balance;
    }

    return { balance: info.balance, balances: this.balances };
  }

  gasPrice() {
    return this.getGasPrice();
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }

  getGasRange(sendType = 'send') {
    return this.feeData[sendType];
  }

  async getEstimatedTimeCfg(force = false) {
    try {
      const isUpdateNeeded = !this.gasPriceConfig || force;

      this.gasPriceConfig = isUpdateNeeded ? await this.web3.getGasPriceConfig() : this.gasPriceConfig;
    } catch (error) {
      console.error(error);
    }
    return this.gasPriceConfig;
  }

  async getEstimatedTimeTx(gasPrice, mapping = false) {
    // ACT-992: This multiplier needed because 'fastest', 'fast', 'average' params in config contains gwei * 10
    const multiplier = 10;
    const config = await this.getEstimatedTimeCfg();
    const speed = ['fastest', 'fast', 'average'].find((key) => config?.[key] <= gasPrice * multiplier);

    if (mapping) {
      const TIMES_MAP = {
        fastest: '<30 sec',
        fast: '<2 min',
        average: '<5 min',
      };

      return TIMES_MAP[speed] || '<30 min';
    }
    return speed;
  }

  /**
   * Sign data with pk
   * @param {string} data
   * @return {Sign}
   */
  signData(data) {
    return this.coreLibrary.eth.accounts.sign(data, this.#privateKey);
  }

  /**
   * Sign with provided 3-th party signer callback
   *
   * @param data Data to sign
   * @param signer Callback function
   * @return {*}
   */
  signWithCustomSigner({ data, signer }) {
    return signer({
      ...data,
      privateKey: Buffer.from(this.#privateKey.slice(2), 'hex'),
    });
  }
}

export default FILCoin;
