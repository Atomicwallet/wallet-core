import BN from 'bn.js';
import { ExternalError } from 'src/errors';

import { Coin } from '../../abstract';
// import logger from '../Logger';
// import configManager from '../ConfigManager';
import { NftMixin } from '../../coins/nfts/mixins';
import ETHNftExplorer from '../../explorers/collection/ETHNftExplorer';
import MoralisExplorer from '../../explorers/collection/MoralisExplorer';
import SnowTraceExplorer from '../../explorers/collection/SnowTraceExplorer';
import Web3Explorer from '../../explorers/collection/Web3Explorer';
import { LazyLoadedLib } from '../../utils';
import { EXTERNAL_ERROR } from '../../utils/const';
import HasBlockScanner from '../mixins/HasBlockScanner';
import HasProviders from '../mixins/HasProviders';
import Web3Mixin from '../mixins/Web3Mixin';

const NAME = 'Avalanche C-Chain';
const TICKER = 'AVAX';
const DERIVATION = "m/44'/9000'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const AVAX_CHAIN_ID = 43114;
const nAVAX = 10 ** 9;
const GAS_PRICE_UNITS = 'nAVAX';
const DEFAULT_MAX_GAS = '150000';
const HEX_ZERO = '0x0';
const WEB3_SDK = 'web3Sdk';
const ETHEREUM_JS_WALLET_SDK = 'ethereumJsWalletSdk';

/**
 * @class AVAXCoin
 */
class AVAXCoin extends Web3Mixin(NftMixin(HasProviders(HasBlockScanner(Coin)))) {
  #privateKey;

  /** @type {string} */
  web3BaseUrl;
  /** @type {import('web3').default|null} */
  coreLibrary = null;

  /**
   * constructs the object.
   *
   * @param  {object} config
   */
  constructor(config) {
    super({
      ...config,
      name: config.name ?? NAME,
      ticker: config.ticker ?? TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      chainId: config.chainId || AVAX_CHAIN_ID,
      dependencies: {
        [WEB3_SDK]: new LazyLoadedLib(() => import('web3')),
        [ETHEREUM_JS_WALLET_SDK]: new LazyLoadedLib(() => import('ethereumjs-wallet')),
      },
    });

    this.derivation = DERIVATION;

    this.setExplorersModules([Web3Explorer, SnowTraceExplorer, ETHNftExplorer, MoralisExplorer]);

    this.loadExplorers(config);

    const { feeData, explorers } = config;

    this.setFeeData(feeData);

    const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');

    this.web3BaseUrl = web3Params.baseUrl;

    this.fields.paymentId = false;
    this.nonce = new this.BN('0');
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

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.gasLimit = String(feeData.gasLimit);
    this.gasLimitCoefficient = feeData.gasLimitCoefficient;
    this.gasPriceCoefficient = feeData.gasPriceCoefficient;
    this.defaultGasPrice = new this.BN(feeData.defaultGasPrice);
    this.defaultMaxGasPrice = new this.BN(feeData.defaultMaxGasPrice).div(new this.BN(nAVAX));
    this.resendTimeout = feeData.resendTimeout;
    this.nftGasLimitCoefficient = feeData.nftGasLimitCoefficient;
    this.nftGasPriceCoefficient = feeData.nftGasPriceCoefficient;
  }

  isFeeDynamic() {
    return true;
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
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
   * The address getter
   *
   * @return {Promise<string>} { description_of_the_return_value }
   */
  async getAddress() {
    const coreLibrary = await this.getCoreLibrary();

    return this.#privateKey
      ? coreLibrary.eth.accounts.privateKeyToAccount(this.#privateKey).address
      : new Error(`${this.wallet.ticker} private key is empty`);
  }

  /**
   * Validates wallet address
   *
   * @param {string} address The address
   * @return {Promise<boolean>}
   */
  async validateAddress(address) {
    const coreLibrary = await this.getCoreLibrary();

    return coreLibrary.utils.isAddress(address);
  }

  /**
   * Creates a transaction.
   *
   * @param {string} address The destination address
   * @param {number} amount The amount to send
   * @param {string} paymentData The payment id (only HEX value!)
   * @param {string} gasLimit
   * @param {string} userGasPrice
   * @param {number} multiplier coefficient
   * @return {Promise<string>} Raw transaction
   */
  async createTransaction({ address, amount, paymentData = null, userGasPrice, gasLimit = this.gasLimit }) {
    const [coreLibrary] = await Promise.all([this.getCoreLibrary(), this.getNonce()]);

    const transaction = {
      to: address,
      value: amount,
      gas: gasLimit || this.gasLimit,
      chainId: this.chainId,
      gasPrice: new this.BN(userGasPrice || (await this.getGasPrice())),
      nonce: this.nonce.toString(),
    };

    if (paymentData) {
      transaction.data = paymentData;
    }

    const signedTx = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);

    return signedTx.rawTransaction;
  }

  /**
   * Gets the transactions.
   *
   * @return {Promise<Object[]>} The transactions.
   */
  async getTransactions() {
    if (!this.address) {
      throw new Error(`${this.wallet.ticker} address not found`);
    }

    return this.getProvider('history').getTransactions({
      address: this.address,
    });
  }

  async getNonce() {
    const coreLibrary = await this.getCoreLibrary();

    this.nonce = new this.BN(await coreLibrary.eth.getTransactionCount(this.address));

    return this.nonce;
  }

  /**
   * Gets the fee.
   *
   * @return {Promise<BN>} The fee.
   */
  async getFee({ userGasPrice = null, gasLimit = null } = {}) {
    return new this.BN(new this.BN(userGasPrice || (await this.getGasPrice()))).mul(
      new this.BN(gasLimit !== null ? gasLimit : this.gasLimit),
    );
  }

  async getGasPrice(withoutCoeff = false) {
    try {
      if (withoutCoeff) {
        const coreLibrary = await this.getCoreLibrary();

        return new this.BN(await coreLibrary.eth.getGasPrice());
      }

      const { fastest } = await this.getProvider('gas_price').getGasPrice();
      // (await configManager.get('avax-c-gas-price')) ||

      return new this.BN(fastest).mul(new this.BN(nAVAX));
    } catch (error) {
      // logger.error({
      //   instance: this,
      //   error,
      // });

      const gasPrice = new this.BN(new this.BN(this.defaultGasPrice));

      return withoutCoeff ? gasPrice : gasPrice.add(new this.BN(this.gasPriceCoefficient));
    }
  }

  /**
   * Return available balance for send
   *
   * @return {Promise<string>}
   */
  async availableBalance(fee) {
    if (!this.balance) {
      return '0';
    }

    const maximumFee = fee ? new this.BN(fee) : await this.getFee();
    const availableBalance = new this.BN(this.balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));

    if (new this.BN(availableBalance).lt(new this.BN(0))) {
      return '0';
    }

    return this.toCurrencyUnit(availableBalance);
  }

  async updateBalance() {
    try {
      const { balance } = await this.getProvider('balance').getInfo(this.address);

      if (!balance) {
        throw new Error(`${this.ticker} can't get balance`);
      }

      this.balance = balance;
    } catch (error) {
      console.error(error);
    }
  }

  async getInfo() {
    // @TODO Refactor using coreLibrary in the Web3Explorer
    // Core library is required in the Web3Explorer, which is obtained there from wallet.instance.
    // We need to make sure that the core Library is present and initialized.
    await this.initCoreLibrary();

    this.getNonce();

    if (!this.address) {
      throw new Error(`${this.ticker} address not found`);
    }

    await this.updateBalance();

    return { balance: this.balance };
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

  async checkTransaction(txInfo) {
    await super.checkTransaction({ feeTicker: this.ticker, ...txInfo });
  }

  async getBalance() {
    return (await this.getInfo()).balance;
  }

  getGasPriceUnits() {
    return GAS_PRICE_UNITS;
  }

  /**
   * Gets the fee required to transfer the NFT
   *
   * @param {Object} params
   * @param {string | null} params.contractAddress - NFT contract address.
   * @param {string} params.tokenId - Token id.
   * @param {ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string} params.tokenStandard - Token standard.
   * @param {string} params.toAddress - Recipient address.
   * @param {UserFeeOptions} [params.userOptions={}] - Custom user options.
   * @return {Promise<BN>} - The fee.
   * @throws {ExternalError}
   */
  async getNftFee({ contractAddress, tokenId, tokenStandard, toAddress, userOptions = {} }) {
    try {
      const data = await this.getProvider('nft-send').getNftContractData(
        this,
        toAddress,
        contractAddress,
        tokenId,
        tokenStandard,
      );
      const { gasLimit, gasPrice } = await this.getNftTransferGasParams(toAddress, data, userOptions);

      return new BN(gasPrice).mul(new BN(gasLimit));
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * @typedef UserFeeOptions
   * @type {Object}
   * @property {string} [userGasLimit] - Custom gas limit.
   * @property {string} [userGasPrice] - Custom gas price.
   */

  /**
   * @param {string} toAddress - The destination address.
   * @param {string} data - Contract encoded data.
   * @param {UserFeeOptions} userOptions - Custom user options.
   * @returns {Promise<{gasLimit: string, gasPrice: string, nonce: number}>}
   */
  async getNftTransferGasParams(toAddress, data, { userGasPrice, userGasLimit }) {
    const {
      address,
      nftGasPriceCoefficient,
      nftGasLimitCoefficient,
      gasPriceCoefficient: configGasPriceCoefficient,
      gasLimitCoefficient: configGasLimitCoefficient,
      defaultGasPrice,
      gasLimit: coinGasLimit = DEFAULT_MAX_GAS,
    } = this;

    /** @type number */
    const gasPriceCoefficient = nftGasPriceCoefficient || configGasPriceCoefficient;
    /** @type number */
    const gasLimitCoefficient = nftGasLimitCoefficient || configGasLimitCoefficient;

    const defaultGasValues = [
      new BN(defaultGasPrice).mul(new BN(gasPriceCoefficient)).toString(),
      Math.ceil(Number(coinGasLimit) * gasLimitCoefficient).toString(),
    ];

    const nonce = (await this.getNonce()).toNumber();

    const [gasPrice, gasLimit] = await Promise.allSettled([
      userGasPrice || this.getNftGasPrice(gasPriceCoefficient),
      userGasLimit || this.estimateGasForSendNft(address, toAddress, nonce, data, gasLimitCoefficient),
    ]).then((resultList) =>
      resultList.map((result, i) => {
        return result.status === 'fulfilled' ? result.value : defaultGasValues[i];
      }),
    );

    return { gasLimit, gasPrice, nonce };
  }

  /**
   * Gets gas limit from node
   *
   * @param {string} address - Wallet address.
   * @param {string} toAddress - Destination wallet address.
   * @param {number} nonce - Nonce.
   * @param {string} data - Encoded token ABI data.
   * @param {number} [gasLimitCoefficient = 1] - Custom coefficient for tune gas limit.
   * @returns {Promise<string>}
   * @throws {ExternalError}
   */
  async estimateGasForSendNft(address, toAddress, nonce, data, gasLimitCoefficient = 1) {
    try {
      /** @type number */
      const fetchedGasLimit = await this.getProvider('nft-send').estimateGas(address, toAddress, nonce, data);

      return Math.ceil(fetchedGasLimit * gasLimitCoefficient).toString();
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Gets nft gas price from node
   *
   * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas.
   * @returns {Promise<string>}
   * @throws {ExternalError}
   */
  async getNftGasPrice(gasPriceCoefficient = 1) {
    try {
      const fetchedGasPrice = await this.getProvider('nft-send').getGasPrice();

      return new BN(fetchedGasPrice).mul(new BN(gasPriceCoefficient)).toString();
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Creates an NFT transfer transaction.
   *
   * @param {string} toAddress - The destination address.
   * @param {string} contractAddress - NFT contract address.
   * @param {string} data - Contract encoded data.
   * @param {UserFeeOptions} [userOptions={}] - Custom user options.
   * @return {Promise<string>} - Raw transaction
   * @throws {ExternalError}
   */
  async createNftTransaction({ toAddress, contractAddress, data, userOptions = {} }) {
    try {
      const { gasLimit, gasPrice, nonce } = await this.getNftTransferGasParams(toAddress, data, userOptions);

      const transaction = {
        to: contractAddress,
        value: HEX_ZERO,
        gas: gasLimit,
        data,
        nonce,
        // Old way - non EIP-1559
        gasPrice,
      };

      const coreLibrary = await this.getCoreLibrary();
      const { rawTransaction } = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);

      return rawTransaction;
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
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

export default AVAXCoin;
