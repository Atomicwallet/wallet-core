import { Coin } from 'src/abstract';
import { NftMixin } from 'src/coins/nfts/mixins';
import { ExternalError } from 'src/errors';
import CovalentHQExplorer from 'src/explorers/collection//CovalentHQExplorer';
import EtherscanExplorer from 'src/explorers/collection//EtherscanExplorer';
import ETHNftExplorer from 'src/explorers/collection//ETHNftExplorer';
import MoralisExplorer from 'src/explorers/collection//MoralisExplorer';
import PolyscanExplorer from 'src/explorers/collection//PolyscanExplorer';
import Web3Explorer from 'src/explorers/collection//Web3Explorer';
import BlockbookV2WithBlockscannerExplorer from 'src/explorers/extended/BlockbookV2WithBlockscannerExplorer';
import Transaction from 'src/explorers/Transaction';
import { ARBToken } from 'src/tokens';
import { LazyLoadedLib } from 'src/utils';
import { EXTERNAL_ERROR } from 'src/utils/const';
import { toCurrency } from 'src/utils/convert';

import HasProviders from '../mixins/HasProviders';
import HasTokensMixin from '../mixins/HasTokensMixin';
import Web3Mixin from '../mixins/Web3Mixin';

const NAME = 'Ethereum ARB';
const TICKER = 'ETHARB';
const ID = 'ARB';
const NETWORK = 'arbitrum';
const DERIVATION = "m/44'/9001'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = 1e13;
// @TODO Refactor to use different chainIDs in explorers
const ARB_CHAIN_ID = 42161;
const GWEI = 1e9;

// Public key from a compromised mnemonic used for unit tests
const MOCKED_ARB_ADDRESS = '0x29625E10Cfe090294DC0eC579E322ce87C822745';

const DEFAULT_MIN_GAS = 500 * 1e3;
const DEFAULT_MAX_GAS = 1500 * 1e3;
const DEFAULT_BLOCK = 'pending';
const HEX_ZERO = '0x0';

const CHECK_TX_UPDATE_TIMEOUT = 3000;
// const TOKENS_CONFIG_KEY = ConfigKey.ArbitrumTokens;
// const BANNED_TOKENS_CONFIG_KEY = ConfigKey.ArbitrumTokensBanned;
// RPC Error code -32000
const ESTIMATE_GAS_ERROR_MESSAGE_SUBSTRING = 'insufficient funds';

const WEB3_SDK = 'web3Sdk';
const ETHEREUM_JS_WALLET_SDK = 'ethereumJsWalletSdk';

/**
 * @class ARBCoin
 * @TODO Add Mixins to implement nft, stakes. @See ETHCoin.
 */
class ARBCoin extends Web3Mixin(NftMixin(HasProviders(HasTokensMixin(Coin)))) {
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
      chainId: config.chainId ?? ARB_CHAIN_ID,
      l2Name: ID,
      network: config.network ?? NETWORK,
      dependencies: {
        [WEB3_SDK]: new LazyLoadedLib(() => import('web3')),
        [ETHEREUM_JS_WALLET_SDK]: new LazyLoadedLib(() => import('ethereumjs-wallet')),
      },
    });

    this.setExplorersModules([
      Web3Explorer,
      BlockbookV2WithBlockscannerExplorer,
      ETHNftExplorer,
      PolyscanExplorer,
      MoralisExplorer,
      CovalentHQExplorer,
      EtherscanExplorer,
    ]);

    this.loadExplorers(config);

    this.derivation = DERIVATION;

    const { feeData, explorers } = config;

    this.setFeeData(feeData);

    this.gasPriceConfig = null;
    this.bannedTokens = [];

    const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');

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

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.unspendableBalance = feeData.unspendableBalance || UNSPENDABLE_BALANCE;
    this.gasLimit = Number(feeData.gasLimit) || DEFAULT_MIN_GAS;
    // @TODO replace by estimated gasLimit in future
    this.stakingGasLimit = Number(feeData.stakingGasLimit) || DEFAULT_MAX_GAS;
    this.maxGasLimit = Number(feeData.maxGasLimit) || DEFAULT_MAX_GAS;
    this.nftGasLimitCoefficient = Number(feeData.nftGasLimitCoefficient) || 1;
    this.nftGasPriceCoefficient = Number(feeData.nftGasPriceCoefficient);
    this.gasLimitCoefficient = Number(feeData.gasLimitCoefficient) || 1;
    this.gasPriceCoefficient = Number(feeData.gasPriceCoefficient) || 0;
    this.defaultGasPrice = Number(feeData.defaultGasPrice) || 1;
    this.defaultMaxGasPrice = Number(feeData.defaultMaxGasPrice) || 100;
    this.resendTimeout = feeData.resendTimeout;
  }

  isFeeDynamic() {
    return true;
  }

  async getTransactions() {
    if (!this.address) {
      throw new Error(`${TICKER}: getTransactions: address is not loaded`);
    }

    // @TODO Check for failed transactions (@see ETHCoin)
    const [transactions, { tokenTransactions: rawTokenTransactions }] = await Promise.all(
      [
        this.getProvider('history').getTransactions({
          address: this.address,
        }),
        this.getProvider('token-history').getTokensTransactions({
          address: this.address,
        }),
      ].map((promise) =>
        promise.catch((error) => {
          console.error(error);
          return [];
        }),
      ),
    );

    const tokenTransactions = rawTokenTransactions.reduce((txs, rawTx) => {
      const contract = rawTx.contract.toLowerCase();
      const token = this.tokens[contract];

      const isKnownToken = !!token;

      txs.push(
        new Transaction({
          ...rawTx,
          amount: isKnownToken ? rawTx.amount : null,
        }),
      );
      return txs;
    }, []);

    return transactions.concat(tokenTransactions);
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
   * List to be exluded from wallets list
   * @return {Array<String>} array of tickers
   */
  getExcludedTokenList() {
    return ['TRX', 'EOS', 'ICX', 'VEN', 'AION', 'BTT', 'KIN', 'BNB']
      .concat(Array.isArray(this.bannedTokens) ? this.bannedTokens : [])
      .map((token) => token.toLowerCase());
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<{id: string, privateKey: string, address: string}>} The private key.
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
    const coreLibrary = await this.getCoreLibrary();

    return coreLibrary.utils.isAddress(address);
  }

  /**
   * Creates a transaction to transfer funds
   *
   * @param {string} address - The destination address.
   * @param {boolean} [isSendAll=false] - Send all funds sign.
   * @param {string | null} [userFee=null] - User fee precalculated for send all funds.
   * @param {string} amount - Amount of funds to send (not used if isSendAll=true).
   * @param {number} nonce - Nonce.
   * @param {string | null} [userGasPrice=null] - Custom gas price.
   * @param {number} [multiplier] - Gas price coefficient - Not used here.
   * @param {string} [gasLimit] - Custom gas limit.
   * @param {string | null} [paymentData=null] - The payment id (only HEX value!).
   * @return {Promise<string>} - Raw signed transaction
   */
  async createTransaction({
    address,
    isSendAll = false,
    userFee = null,
    amount,
    nonce,
    userGasPrice,
    multiplier,
    gasLimit,
    paymentData = null,
  }) {
    // Fallbacks only for coin since gasLimit is always set for contracts
    const gas = gasLimit || (await this.estimateGas(amount, address)) || this.gasLimit;
    const gasPrice = userGasPrice || (await this.getGasPrice());

    const transaction = {
      to: address,
      value: amount,
      gas,
      chainId: ARB_CHAIN_ID,
      gasPrice,
      nonce: nonce || (await this.getNonce()),
    };

    if (paymentData !== '' && paymentData !== null) {
      transaction.data = paymentData;
    }

    const coreLibrary = await this.getCoreLibrary();
    const signedTx = await coreLibrary.eth.accounts.signTransaction(transaction, this.#privateKey);

    return signedTx.rawTransaction;
  }

  #getTransferTokenContractData(contract, to, amount) {
    return this.getProvider('send').createSendTokenContract(contract, this.address, to, amount);
  }

  async createTokenTransaction({ address, amount, custom, userGasPrice, gasLimit, contract, multiplier }) {
    const contractData = this.#getTransferTokenContractData(contract, address, amount);

    return this.createTransaction({
      address: contract,
      amount: HEX_ZERO,
      paymentData: contractData,
      userGasPrice,
      gasLimit: gasLimit || (await this.estimateGas(amount, address, contract)),
      multiplier,
    });
  }

  /**
   * Sends transaction
   * @async
   * @param {string} rawtx
   * @returns {Promise<Transaction>}
   */
  sendTransaction(rawtx) {
    return this.getProvider('send').sendTransaction(rawtx);
  }

  /**
   * Sets status to 1 to mark transaction as completed.
   * Borrowed from Web3Explorer.
   *
   */
  async checkTransaction(txInfo) {
    const { coin, address, amount, memo, txid, nonce, fee } = txInfo;

    try {
      const newTx = new Transaction({
        ticker: coin.ticker,
        walletid: coin.id,
        name: coin.name,
        alias: coin.alias,
        txid,
        direction: this.address === address,
        otherSideAddress: address,
        amount: toCurrency(amount, coin.decimal),
        datetime: new Date(),
        memo,
        nonce,
        confirmations: 1,
        fee,
        feeTicker: this.ticker,
      });

      // await history.filterAndUpdateTransactions([newTx]);

      this.eventEmitter.emit('socket::newtx::outgoing', {
        id: this.id,
        ticker: coin.ticker,
      });

      setTimeout(async () => {
        await this.getBalance();
      }, CHECK_TX_UPDATE_TIMEOUT);
    } catch (error) {
      console.warn(this.ticker, 'Unable to check transaction');
    }
  }

  /**
   * Gets max fee per gas from Eth Gas Station
   * For support EIP-1559 standard
   *
   * @deprecated Use getGasPriceForSendNft method instead
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
    return standardPrice.mul(new this.BN(gasPriceCoefficient)).toString();
  }

  /**
   * Gets gas price from blockchain
   *
   * @param {number} [coefficient = 1] - Custom coefficient for tune gas price.
   * @returns {Promise<number>} - Gas price in WEI
   */
  async getGasPriceForSendNft(coefficient) {
    const rawGasPrice = await this.getGasPrice(true);
    const gasPrice = Number(rawGasPrice) + coefficient * GWEI;
    const defaultMaxGasPriceInGwei = this.defaultMaxGasPrice * GWEI;

    return gasPrice > defaultMaxGasPriceInGwei ? defaultMaxGasPriceInGwei : gasPrice;
  }

  /**
   * Gets gas limit from node
   *
   * @param {string} address - Wallet address.
   * @param {string} toContract - NFT contract address.
   * @param {string} data - Encoded token ABI data.
   * @param {number} [gasLimitCoefficient = 1] - Custom coefficient for tune gas limit.
   * @returns {Promise<number>}
   */
  async estimateGasForSendNft(address, toContract, data, gasLimitCoefficient = 1) {
    const transactionObject = {
      from: address,
      to: toContract,
      value: HEX_ZERO,
      data,
    };

    const coreLibrary = await this.getCoreLibrary();
    const estimatedGas = await coreLibrary.eth.estimateGas(transactionObject).catch((error) => {
      // Error code -32000 means insufficient funds, which is not an error in the initial gas evaluation
      if (!error.message.includes(ESTIMATE_GAS_ERROR_MESSAGE_SUBSTRING)) {
        // @TODO implement logger
      }
      // Fallback value
      return this.maxGasLimit;
    });

    return Math.round(estimatedGas * this.nftGasLimitCoefficient);
  }

  /**
   * @typedef UserFeeOptions
   * @type {Object}
   * @property {string} [userGasLimit] - Custom gas limit.
   * @property {string} [userGasPrice] - Custom gas price.
   */

  /**
   * @param {string} toContract - The NFT contract address.
   * @param {string} data - Contract encoded data.
   * @param {UserFeeOptions} userOptions - Custom user options.
   * @returns {Promise<{gasLimit: number, gasPrice: number, nonce: number}>}
   */
  async getNftTransferGasParams(toContract, data, { userGasPrice, userGasLimit }) {
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
      (defaultGasPrice + gasPriceCoefficient) * GWEI,
      Math.ceil(coinGasLimit * gasLimitCoefficient),
    ];

    const nonce = (await this.getNonce()).toNumber();

    const [gasPrice, gasLimit] = await Promise.allSettled([
      userGasPrice || this.getGasPriceForSendNft(gasPriceCoefficient),
      userGasLimit || this.estimateGasForSendNft(address, toContract, data, gasLimitCoefficient),
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
   * @param {string|null} [params.toAddress=null] - Recipient address. If it is null or equal to the self wallet
   * address, then the fake address will be used.
   * @param {UserFeeOptions} [params.userOptions={}] - Custom user options.
   * @return {Promise<BN>} - The fee.
   * @throws {ExternalError}
   */
  async getNftFee({ contractAddress, tokenId, tokenStandard, toAddress = null, userOptions = {} }) {
    const targetAddress =
      !toAddress || toAddress.toLowerCase() === this.address.toLowerCase() ? MOCKED_ARB_ADDRESS : toAddress;

    try {
      const data = await this.getProvider('nft-send').getNftContractData(
        this,
        targetAddress,
        contractAddress,
        tokenId,
        tokenStandard,
      );
      const { gasLimit, gasPrice } = await this.getNftTransferGasParams(contractAddress, data, userOptions);

      return new this.BN(gasPrice).mul(new this.BN(gasLimit));
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Creates an NFT transfer transaction.
   *
   * @param {string} [toAddress] - The destination address. Unused here.
   * @param {string} contractAddress - NFT contract address.
   * @param {string} data - Contract encoded data.
   * @param {UserFeeOptions} [userOptions={}] - Custom user options.
   * @return {Promise<string>} - Raw transaction
   * @throws {ExternalError}
   */
  async createNftTransaction({ contractAddress, data, userOptions = {} }) {
    try {
      const { gasLimit, gasPrice, nonce } = await this.getNftTransferGasParams(contractAddress, data, userOptions);
      const transaction = {
        to: contractAddress,
        value: HEX_ZERO,
        gas: gasLimit,
        data,
        nonce,
        // EIP-1559
        // maxFeePerGas: gasPrice,

        // Here the old way - non EIP-1559
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

  async getNonce() {
    const coreLibrary = await this.getCoreLibrary();

    this.nonce = new this.BN(await coreLibrary.eth.getTransactionCount(this.address, DEFAULT_BLOCK));

    return this.nonce;
  }

  /**
   * Gets the estimated fee for the transaction
   *
   * @param {object} [options] - options.
   * @param {number} [options.amount=1] - Amount.
   * @param {string} [options.address] - Destination address.
   * @param {string} [options.contract=null] - Contract address.
   * @param {string|number} [options.userGasPrice=null] - Custom gas price.
   * @param {string|number} [options.userGasPrice=null] - Custom gas limit.
   * @returns {Promise<BN>}
   */
  async getFee({ amount = 1, address, contract = null, userGasPrice = null, gasLimit = null } = {}) {
    const gasPriceL2 = userGasPrice || (await this.getGasPrice());
    const requiredGas = gasLimit || (await this.estimateGas(amount, address, contract));

    return new this.BN(gasPriceL2).mul(new this.BN(requiredGas));
  }

  /**
   * Gets gas price in WEI
   *
   * @param {boolean} [withoutCoeff] - Returns the net gas price if it is set.
   * @returns {Promise<number>}
   */
  async getGasPrice(withoutCoeff = false) {
    const { node: rawGasPrice } =
      (await this.getProvider('node')
        .getGasPrice()
        .catch((error) => {
          console.warn(`rawGasPrice for ${NAME} error:`, error);
        })) ?? {};

    const gasPrice = Number(rawGasPrice) || this.defaultGasPrice * GWEI;

    if (withoutCoeff) {
      return gasPrice;
    }

    // @TODO Maybe we should increase gasPrice at once by 25% so as not to hit the limit of the 5-minute interval
    //  of change in gasPrice network
    return gasPrice + this.gasPriceCoefficient * GWEI;
  }

  /**
   * Estimates gas
   * @param {number} amount - Amount.
   * @param {string} [toAddress=MOCKED_ARB_ADDRESS] - Destination address.
   * @param {string} contractAddress - Contract address.
   * @returns {Promise<number>}
   */
  async estimateGas(amount, toAddress, contractAddress) {
    const to = toAddress || MOCKED_ARB_ADDRESS;
    const transactionObject = {
      from: this.address,
      to,
      value: amount,
    };

    if (contractAddress) {
      transactionObject.data = this.#getTransferTokenContractData(contractAddress, to, amount);
    }

    const coreLibrary = await this.getCoreLibrary();
    const estimatedGas = await coreLibrary.eth.estimateGas(transactionObject).catch((error) => {
      // Error code -32000 means insufficient funds, which is not an error in the initial gas evaluation
      if (!error.message.includes(ESTIMATE_GAS_ERROR_MESSAGE_SUBSTRING)) {
        // @TODO implement logger
      }
      // Fallback value
      return contractAddress ? this.maxGasLimit : this.gasLimit;
    });

    return Math.round(estimatedGas * this.gasLimitCoefficient);
  }

  /**
   * Gets available balance for send in ARB
   *
   * @param {string|number|BN} fee - Custom fee in WEI.
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

    // @TODO To be used in future Fantom implementation
    // await this.getStakingInfo()

    return { balance: info?.balance, balances: this.balances };
  }

  /**
   * Only predefined smart-contract is available
   * @returns {Promise<[]>}
   */
  getUserValidators() {
    return this.getPredefinedValidators();
  }

  /**
   * Creates a token.
   *
   * @param {object} args - The arguments
   * @return {ARBToken}
   */
  createToken(args) {
    return new ARBToken({
      parent: this,
      ...args,
    });
  }

  /**
   * Returns user token list data
   * @returns {Promise<Array>}
   */
  async getUserTokenList() {
    const userTokens = (
      (await this.getProvider('token')
        .getUserTokenList(this.address)
        .catch((error) => console.warn(error))) || []
    ).filter((token) => token.supportedStandards?.includes('erc20'));

    // Set balance for existing user tokens
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
   * Gets forced config or its fallback
   * @param {string} configKey
   * @returns {Promise<object|object[]>}
   */
  async #getForcedConfigOrFallback(configKey) {
    return {};
  }

  /**
   * Returns all token list data
   * @returns {Promise<Array>}
   */
  async getTokenList() {
    this.bannedTokens = await this.getBannedTokenList();
    return this.#getForcedConfigOrFallback(); // TOKENS_CONFIG_KEY;
  }

  /**
   * Returns banned token list data
   * @async
   * @returns {Promise<Array>}
   */
  getBannedTokenList() {
    return this.#getForcedConfigOrFallback(); // BANNED_TOKENS_CONFIG_KEY;
  }

  /**
   * Maps from user token list to internal token format
   * @returns {Promise<Array>}
   */
  getTokenFromUserList(token, source) {
    return {
      ...token,
      source,
      visibility: true,
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

  /**
   * Returns an indication that the coin is running on the L2 blockchain
   * @returns {boolean|undefined} - false or undefined if not L2
   */
  get isL2() {
    return true;
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

export default ARBCoin;
