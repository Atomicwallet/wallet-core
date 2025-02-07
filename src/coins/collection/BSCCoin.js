import BN from 'bn.js';
import { Coin } from 'src/abstract';
import { NftMixin } from 'src/coins/nfts/mixins';
import { ExternalError } from 'src/errors';
import BlockbookV2Explorer from 'src/explorers/collection/BlockbookV2Explorer';
import ETHNftExplorer from 'src/explorers/collection/ETHNftExplorer';
import MoralisExplorer from 'src/explorers/collection/MoralisExplorer';
import Web3Explorer from 'src/explorers/collection/Web3Explorer';
import BANNED_TOKENS_CACHE from 'src/resources/binance/bsc-tokens-banned.json';
import TOKENS_CACHE from 'src/resources/binance/bsc-tokens.json';
import { BSCToken } from 'src/tokens';
import { LazyLoadedLib } from 'src/utils';
import { ConfigKey } from 'src/utils/configManager';
import { EXTERNAL_ERROR } from 'src/utils/const';
import Web3 from 'web3';

import HasBlockScanner from '../mixins/HasBlockScanner';
import HasProviders from '../mixins/HasProviders';
import HasTokensMixin from '../mixins/HasTokensMixin';
import Web3Mixin from '../mixins/Web3Mixin';

const hdkeyLazyLoaded = new LazyLoadedLib(() => import('ethereumjs-wallet'));

const NAME = 'BNB Smart Chain';
const TICKER = 'BSC';
const DERIVATION = "m/44'/0'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const BSC_CHAIN_ID = 56;
const INIT_PROVIDER_TIMEOUT = 10000;
const GWEI = 1000000000;

const MOCK_ETH_ADDR = '0xbdd5468D969e585E38B5a0EEADDb56D5B76814ff';
const DEFAULT_MAX_GAS = '150000';
const HEX_ZERO = '0x0';

/**
 * @class BSCCoin
 */
class BSCCoin extends Web3Mixin(NftMixin(HasBlockScanner(HasProviders(HasTokensMixin(Coin))))) {
  #privateKey;

  /**
   * constructs the object.
   *
   * @param  {object} config
   */
  constructor(config, db, configManager) {
    super(
      {
        ...config,
        name: config.name ?? NAME,
        ticker: config.ticker ?? TICKER,
        decimal: DECIMAL,
        unspendableBalance: UNSPENDABLE_BALANCE,
      },
      db,
      configManager,
    );

    this.derivation = DERIVATION;

    this.setExplorersModules([Web3Explorer, BlockbookV2Explorer, MoralisExplorer, ETHNftExplorer]);

    this.loadExplorers(config);

    const { feeData, explorers, txWebUrl } = config;

    this.setFeeData(feeData);
    this.bannedTokens = [];

    const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');

    this.web3 = new Web3Explorer({
      wallet: this.instance,
      config: { ...web3Params, webUrl: txWebUrl },
    });

    this.baseUrl = web3Params.baseUrl;

    this.initProvider(this.baseUrl);

    this.fields.paymentId = false;
    this.tokens = {};
    this.nonce = new this.BN('0');
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.gasLimit = String(feeData.gasLimit);
    this.nftGasLimitCoefficient = feeData.nftGasLimitCoefficient;
    this.nftGasPriceCoefficient = feeData.nftGasPriceCoefficient;
    this.gasLimitCoefficient = feeData.gasLimitCoefficient;
    this.gasPriceCoefficient = feeData.gasPriceCoefficient;
    this.defaultGasPrice = new this.BN(feeData.defaultGasPrice * GWEI);
    this.defaultMaxGasPrice = feeData.defaultMaxGasPrice;
    this.resendTimeout = feeData.resendTimeout;
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

  isFeeDynamic() {
    return true;
  }

  /**
   * Retry init web3 provider each 10 seconds
   * if `new Web3` throws error for some reason
   *
   * @param provider url string
   */
  initProvider(provider) {
    try {
      this.coreLibrary = new Web3(provider);
    } catch (error) {
      // @TODO implement logger
      setTimeout(() => this.initProvider(provider), INIT_PROVIDER_TIMEOUT);
    }
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  loadWallet(seed) {
    return new Promise(async (resolve, reject) => {
      const { hdkey } = await hdkeyLazyLoaded.get();
      const ethHDKey = hdkey.fromMasterSeed(seed);
      const wallet = ethHDKey.getWallet();
      const account = await this.coreLibrary.eth.accounts.privateKeyToAccount(wallet.getPrivateKeyString());

      if (!account) {
        reject(new Error(`${TICKER} cant get a wallet!`));
      } else {
        this.#privateKey = account.privateKey;
        this.address = account.address;
        this.getNonce();

        resolve({
          id: this.id,
          privateKey: this.#privateKey,
          address: this.address,
        });
      }
    });
  }

  /**
   * The address getter
   *
   * @return {String} { description_of_the_return_value }
   */
  getAddress() {
    try {
      this.#privateKey = this.coreLibrary.eth.accounts.privateKeyToAccount(this.#privateKey).address;
    } catch (error) {
      // @TODO implement logger
    }
    return this.#privateKey;
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    return this.coreLibrary.utils.isAddress(address);
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @param {String} paymentData The payment id (only HEX value!)
   * @param {String} gasLimit
   * @param {Number} multiplier coefficient
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({
    address,
    amount,
    paymentData = null,
    nonce,
    userGasPrice,
    gasLimit = this.gasLimit,
    multiplier = this.gasPriceCoefficient,
  }) {
    let gasPriceIncremented;

    await this.getNonce();

    if (!userGasPrice) {
      const gasPrice = await this.getGasPrice();

      gasPriceIncremented = Number(gasPrice.toString()) * multiplier;
    }

    const transaction = {
      to: address,
      value: amount,
      gas: gasLimit || (await this.estimateGas(amount, address)),
      chainId: BSC_CHAIN_ID,
      gasPrice: new this.BN(userGasPrice || gasPriceIncremented),
      nonce: nonce || this.nonce,
    };

    this.nonce = this.nonce.add(new this.BN(1));

    if (paymentData !== '' && paymentData !== null) {
      transaction.data = paymentData;
    }

    const signedTx = await this.coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);

    return signedTx.rawTransaction;
  }

  async createTokenTransaction({ address, amount, custom, userGasPrice, gasLimit, contract, multiplier, nonce }) {
    const contractData = this.getProvider('send').createSendTokenContract(
      contract,
      this.address,
      address,
      amount,
      nonce,
    );

    return this.createTransaction({
      address: contract,
      amount: '0x0',
      paymentData: contractData,
      userGasPrice,
      gasLimit: gasLimit || (await this.estimateGas(amount, address)),
      multiplier,
      nonce,
    });
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

      const { rawTransaction } = await this.coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);

      return rawTransaction;
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  async getNonce() {
    this.nonce = new this.BN(await this.coreLibrary.eth.getTransactionCount(this.address));

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
    const { fastest = null, standard = null } = await this.getProvider('node').getGasPrice();

    if (withoutCoeff) {
      return standard || this.defaultGasPrice;
    }

    if (!fastest) {
      return this.defaultGasPrice;
    }

    const coeff = new this.BN(this.gasPriceCoefficient);
    const gasInCurrency = new this.BN(Number(standard) / GWEI);

    const gasWithCoeff = gasInCurrency.add(coeff);

    return new this.BN(Number(gasWithCoeff) * GWEI);
  }

  async estimateGas(amount, address, contract, defaultGas = DEFAULT_MAX_GAS) {
    const tokenSendData = this.getProvider('send').createSendTokenContract(
      contract,
      this.address,
      MOCK_ETH_ADDR,
      amount,
    );

    const estimateGas = await this.coreLibrary.eth
      .estimateGas({
        from: this.address,
        nonce: Number(this.nonce.add(new this.BN(1))),
        to: contract,
        data: tokenSendData,
      })
      .catch(() => {});

    return estimateGas ? Math.ceil(estimateGas * this.gasLimitCoefficient).toString() : defaultGas;
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

    const info = await this.getProvider('balance')
      .getInfo(this.address)
      .catch((error) => console.warn(error));

    if (info && info.balance) {
      this.balance = info.balance;
    }

    if (!tokenInfo?.onlyCoin) {
      const tokens = Object.values(this.tokens);

      this.getProvider('node').getTokensInfo(tokens, this.address);
    }

    return { balance: info.balance };
  }

  /**
   * Creates a token.
   *
   * @param {...Array} args The arguments
   * @return {BSCToken}
   *
   **/

  createToken(args) {
    return new BSCToken({
      parent: this,
      ...args,
    });
  }

  /**
   * Returns user token list data
   * @returns {Promise<Array>}
   */
  async getUserTokenList() {
    const userTokens =
      (await this.getProvider('token')
        .getUserTokenList(this.address)
        .catch((error) => console.warn(error))) || [];

    userTokens.forEach((token) => {
      const contract = token.contract;
      const userToken = this.tokens[contract];
      const userTokenLowerCase = this.tokens[contract.toLowerCase()];

      if (userToken) {
        userToken.balance = token.balance;
      }

      if (userTokenLowerCase) {
        userTokenLowerCase.balance = token.balance;
      }
    });
    return userTokens;
  }

  /**
   * Returns all token list data
   * @returns {Promise<Array>}
   */
  async getTokenList() {
    this.bannedTokens = await this.getBannedTokenList();
    const tokens = await this.configManager?.get(ConfigKey.BscTokens);

    return tokens ?? TOKENS_CACHE;
  }

  /**
   * Returns banned token list data
   * @returns {Promise<Array>}
   */
  async getBannedTokenList() {
    const banned = await this.configManager?.get(ConfigKey.BscTokensBanned);

    return banned ?? BANNED_TOKENS_CACHE;
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
      // @TODO implement logger
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

export default BSCCoin;
