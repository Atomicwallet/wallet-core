import BN from 'bn.js';
import Coin from 'src/abstract/coin';
import { ExternalError } from 'src/errors';
import { ETHNftExplorer, MoralisExplorer, Web3Explorer } from 'src/explorers/collection';
import BlockbookV2WithBlockscannerExplorer from 'src/explorers/extended/BlockbookV2WithBlockscannerExplorer';
import BANNED_TOKENS_CACHE from 'src/resources/eth/tokens-banned.json';
import TOKENS_CACHE from 'src/resources/eth/tokens.json';
import ETHToken from 'src/tokens/ETHToken';
import StakableMaticETHToken from 'src/tokens/StakableMaticETHToken';
import { Amount } from 'src/utils';
import { ConfigKey } from 'src/utils/configManager';
import { EXTERNAL_ERROR } from 'src/utils/const';
import LazyLoadedLib from 'src/utils/lazyLoadedLib';

import { StakingMixin, NftMixin } from '../mixins';
import HasProviders from '../mixins/HasProviders';
import HasTokensMixin from '../mixins/HasTokensMixin';
import Web3Mixin from '../mixins/Web3Mixin';

const NAME = 'Ethereum';
const TICKER = 'ETH';
const DERIVATION = "m/44'/0'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const ETH_CHAIN_ID = 1;
const ETH_MODERATED_GAS_PRICE_URL = 'eth-gas-price';
const MODERATED_GAS_PRICE_URL_TIMEOUT = 10000;
const GWEI = 1000000000;

const MOCK_ETH_ADDR = '0xbdd5468D969e585E38B5a0EEADDb56D5B76814ff';
const DEFAULT_MAX_GAS = '150000';
const HEX_ZERO = '0x0';

const LIDO_REF_ADDR = '0xF07A4a4d2fDE367A55FaC93761ecc8181148b826';

/**
 * @class ETHCoin
 */
class ETHCoin extends StakingMixin(Web3Mixin(NftMixin(HasProviders(HasTokensMixin(Coin))))) {
  #privateKey;

  /** @type {string} */
  web3BaseUrl;
  /** @type {object|null} */
  coreLibrary = null;

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
        dependencies: {
          web3: new LazyLoadedLib(() => import('web3')),
          hdkey: new LazyLoadedLib(() => import('ethereumjs-wallet')),
        },
      },
      db,
      configManager,
    );

    this.derivation = DERIVATION;

    this.setExplorersModules([Web3Explorer, MoralisExplorer, ETHNftExplorer, BlockbookV2WithBlockscannerExplorer]);

    this.loadExplorers(config);

    const { feeData, explorers, txWebUrl } = config;

    this.setFeeData(feeData);

    this.gasPriceConfig = null;
    this.bannedTokens = [];

    const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');

    this.web3 = new Web3Explorer({
      wallet: this.instance,
      config: { ...web3Params, webUrl: txWebUrl },
    });

    this.web3BaseUrl = web3Params.baseUrl;

    this.tokens = {};
    this.fields.paymentId = false;
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

    const { default: Web3 } = await this.loadLib('web3');

    this.coreLibrary = new Web3(this.web3BaseUrl);
  }

  /**
   * Gets web3 instance
   * @returns {Promise<*>}
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
    this.stakingGasLimit = feeData.stakingGasLimit || DEFAULT_MAX_GAS; // @TODO replace by estimated gasLimit
    this.nftGasLimitCoefficient = feeData.nftGasLimitCoefficient;
    this.nftGasPriceCoefficient = feeData.nftGasPriceCoefficient;
    this.gasLimitCoefficient = feeData.gasLimitCoefficient;
    this.gasPriceCoefficient = feeData.gasPriceCoefficient;
    this.defaultGasPrice = new this.BN(feeData.defaultGasPrice * GWEI);
    this.defaultMaxGasPrice = feeData.defaultMaxGasPrice;
    this.resendTimeout = feeData.resendTimeout;
  }

  isFeeDynamic() {
    return true;
  }

  getTokenTransactions({ contract }) {
    if (!contract) {
      throw new Error(`${this.ticker}: \`contract\` parameter should be defined`);
    }

    return this.getProvider('tokenHistory').getTokenTransactions({
      address: this.address,
      contract,
    });
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

    // confirmed transaction message received, balance update needed
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
   * List to be excluded from wallets list
   * @return {Array<String>} array of tickers
   */
  getExcludedTokenList() {
    return ['TRX', 'EOS', 'ICX', 'VEN', 'AION', 'BTT', 'KIN', 'BNB']
      .concat(Array.isArray(this.bannedTokens) ? this.bannedTokens : [])
      .map((token) => token.toLowerCase());
  }

  /**
   * Get ETH fee settings
   * @return {Promise<Object>} The ETH fee settings
   * */
  async getFeeSettings() {
    const settings = await this.configManager?.get(ConfigKey.EthereumGasPrice);

    return settings ?? {};
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed) {
    const [coreLibrary, { hdkey }] = await Promise.all([this.getCoreLibrary(), this.loadLib('hdkey')]);

    return new Promise(async (resolve, reject) => {
      const ethHDKey = hdkey.fromMasterSeed(seed);
      const wallet = ethHDKey.getWallet();
      const account = await coreLibrary.eth.accounts.privateKeyToAccount(wallet.getPrivateKeyString());

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
  async getAddress() {
    try {
      const coreLibrary = await this.getCoreLibrary();

      this.#privateKey = coreLibrary.eth.accounts.privateKeyToAccount(this.#privateKey).address;
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
    const coreLibrary = await this.getCoreLibrary();

    return coreLibrary.utils.isAddress(address);
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
    const coreLibrary = await this.getCoreLibrary();

    let gasPriceIncremented;

    await this.getNonce();

    if (!userGasPrice) {
      const gasPrice = await this.getGasPrice();

      gasPriceIncremented = Number(gasPrice.toString()) * multiplier;
    }

    const transaction = {
      to: address,
      value: amount,
      gas: gasLimit,
      chainId: ETH_CHAIN_ID,
      gasPrice: new this.BN(userGasPrice || gasPriceIncremented),
      nonce: nonce || this.nonce,
    };

    if (paymentData !== '' && paymentData !== null) {
      transaction.data = paymentData;
    }

    const signedTx = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);

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
   * Send transacrion and increase nonce by 1
   * @param rawtx
   * @returns {Promise<Transaction>}
   */
  async sendTransaction(rawtx) {
    const tx = await this.getProvider('send').sendTransaction(rawtx);

    if (tx) {
      this.nonce = this.nonce.add(new this.BN(1));
    }

    return tx;
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
      userGasPrice || this.getMaxFeePerGas(gasPriceCoefficient),
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
        // EIP-1559
        maxFeePerGas: gasPrice,
      };

      const coreLibrary = await this.getCoreLibrary();
      const { rawTransaction } = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);

      return rawTransaction;
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
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
    let moderatedGasPrice;

    try {
      moderatedGasPrice = await this.getFeeSettings();
    } catch (error) {
      console.warn(error);
    }

    if (moderatedGasPrice && moderatedGasPrice.fastest && moderatedGasPrice.safeLow) {
      return {
        fastest: new this.BN((moderatedGasPrice.fastest / 10) * GWEI),
        standard: new this.BN((moderatedGasPrice.safeLow / 10) * GWEI),
      };
    }

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

    await this.getStakingInfo();

    return { balance: info?.balance, balances: this.balances };
  }

  getTokenInfo({ contract }) {
    // @TODO provider should be `web3`
    // e.g.: this.getProvider('web3')

    return this.web3.getTokenBalanceByContractAddress({
      address: this.address,
      contractAddress: contract,
    });
  }

  async getStakingInfo() {
    // fetch predefined smart-contracts
    const stakingContracts = await this.getPredefinedValidators();

    // filter existing tokens with predefined smart contract addresses
    const tokens = Object.values(this.tokens).filter(({ contract }) =>
      stakingContracts.some(({ address }) => address.toLowerCase() === contract.toLowerCase()),
    );

    await this.getProvider('stake').getTokensInfo(tokens, this.address);

    const balances = tokens.reduce(
      (acc, { contract, balance = '0', ticker, id, decimal }) => {
        /*
         * We cant calculate total staked balances
         * because every smart-contract has their own decimals
         * But at this point we ensure that every staking smart-contract have same decimals as ETH
         * and their value is 1:1 to ETH
         */
        acc.staked = new Amount(acc.staked.toBN().add(new this.BN(balance)), this);

        acc.validators[contract] = {
          address: contract,
          staked: new Amount(balance, { ticker, id, decimal }),
        };

        return acc;
      },
      { staked: new Amount('0', this), validators: {} },
    );

    this.setBalances(await this.makeStakingInfoStruct(balances));

    return this.balances;
  }

  calculateTotal({ staked }) {
    // total balance is equal to actual ETH  balance + staked;
    // this valid while we use staking through third-party smart-contracts
    // with same decimals, and if their value is 1:1 to ETH

    const total = new this.BN(this.balance ?? 0).add(staked.toBN());

    return new Amount(total, this);
  }

  async calculateAvailableForStake() {
    // we can exactly calculate available balance,
    // because each smart-contract can require various gasLimit values

    const stakingFees = await this.getFee({ gasLimit: this.stakingGasLimit });
    const doubleRegularFees = await this.getFee();

    const fees = stakingFees.add(doubleRegularFees);

    const available = await this.availableBalance(fees);

    return new Amount(this.toMinimalUnit(available), this);
  }

  /**
   * Only predefined smart-contract is available
   * @returns {Promise<[]>}
   */
  getUserValidators() {
    return this.getPredefinedValidators();
  }

  /**
   *
   * @param address smart-contract address
   * @param amount amount in ETH
   * @param gasLimit
   * @return {Promise<String>}
   */
  async createDelegationTransaction({ address, amount, gasLimit }) {
    /*
     * args for this call currently is only valid for Lido smart-contract
     * should be reviewed/refactored when needs to call other smart-contracts
     */
    const data = this.createSmartContractCall({
      smartContractAddress: address,
      action: 'stake',
      args: [LIDO_REF_ADDR],
    });

    const tx = await this.createTransaction({
      address,
      amount,
      paymentData: data,
      gasLimit: this.stakingGasLimit || (await this.estimateGas(amount, address)),
    }); // @TODO replace by estimated gasLimit

    return tx;
  }

  /**
   * Creates a token.
   *
   * @param {...Array} args The arguments
   * @return {ETHToken}
   */
  createToken(args) {
    if (args.isStakable) {
      return new StakableMaticETHToken(
        {
          parent: this,
          ...args,
        },
        this.db,
        this.configManager,
      );
    }

    return new ETHToken(
      {
        parent: this,
        ...args,
      },
      this.db,
      this.configManager,
    );
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

    const tokens = await this.configManager.get(ConfigKey.EthereumTokens);

    return tokens ?? TOKENS_CACHE;
  }

  /**
   * Returns banned token list data
   * @returns {Promise<Array>}
   */
  async getBannedTokenList() {
    const banned = await this.configManager.get(ConfigKey.EthereumTokensBanned);
    return banned ?? BANNED_TOKENS_CACHE;
  }

  /**
   * Converts serverToken to internal token format
   * @returns {Promise<Array>}
   */
  getTokenObject(serverToken, source = 'user') {
    return source === 'user'
      ? this.getTokenFromUserList(serverToken, source)
      : this.getTokenFromCommonList(serverToken, source);
  }

  /**
   * Maps from user token list to internal token format
   * @returns {Promise<Array>}
   */
  getTokenFromUserList(token, source) {
    return {
      name: token.name,
      ticker: token.symbol,
      decimal: Number(token.decimals) || 0,
      contract: token.contractAddress.toLowerCase(),
      parentTicker: TICKER,
      uniqueField: token.contractAddress.toLowerCase(),
      isCustom: false,
      visibility: true,
      confirmed: token.confirmed,
      isStakable: token.isStakable,
      config: token.config,
      // The 'notify' field is for Atomic's internal use, explorers (the source of the 'user list') does not have it.
      // But we don't need to change this value, as it can be set in the native token list for this token.
      notify: token.notify,
      source,
    };
  }

  /**
   * Maps from common token list to internal token format
   * @returns {Promise<Array>}
   */
  getTokenFromCommonList(token, source) {
    return {
      name: token.name,
      ticker: token.ticker,
      decimal: Number(token.decimal) || 0,
      contract: token.contract.toLowerCase(),
      parentTicker: TICKER,
      uniqueField: token.contract.toLowerCase(),
      isCustom: token.isCustom ?? false,
      visibility: token.visibility !== false,
      confirmed: token.confirmed,
      isStakable: token.isStakable,
      config: token.config,
      notify: Boolean(token.notify),
      source,
    };
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

export default ETHCoin;
