import { Coin } from '../../abstract';
import { ExternalError } from '../../errors';
import Web3Explorer from '../../explorers/collection//Web3Explorer';
import CovalentHQExplorer from '../../explorers/collection/CovalentHQExplorer';
import EtherscanExplorer from '../../explorers/collection/EtherscanExplorer';
import Transaction from '../../explorers/Transaction';
import BANNED_TOKENS_CACHE from '../../resources/op/tokens-banned.json';
import TOKENS_CACHE from '../../resources/op/tokens.json';
import { OPToken } from '../../tokens';
// import logger from '../Logger';
// import configManager from '../ConfigManager';
// import { ConfigKey } from '../ConfigManager/ConfigManager.const';
import { LazyLoadedLib } from '../../utils';
import { EXTERNAL_ERROR } from '../../utils/const';
import { toCurrency } from '../../utils/convert';
// import history from '../History';

import ovmGasPriceOracleAbi from '../abi/ovm-gas-price-oracle-abi.json';
import HasProviders from '../mixins/HasProviders';
import HasTokensMixin from '../mixins/HasTokensMixin';
import Web3Mixin from '../mixins/Web3Mixin';

const NAME = 'Ethereum OP';
const TICKER = 'ETHOP';
const ID = 'OP';
const DERIVATION = "m/44'/614'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const OP_CHAIN_ID = 10;
const GWEI = 1e9;
const UNSPENDABLE_BALANCE_FOR_SEND_ALL = 5e4 * GWEI;

// Public key from a compromised mnemonic used for unit tests
const MOCKED_OP_ADDRESS = '0x29625E10Cfe090294DC0eC579E322ce87C822745';
const OVM_GAS_PRICE_ORACLE_CONTRACT_ADDRESS =
  '0x420000000000000000000000000000000000000F';
const EMPTY_OVM_GAS_PRICE_ORACLE_CONTRACT = '0x';

const DEFAULT_MIN_GAS = 21000;
const DEFAULT_MAX_GAS = 150000;
const DEFAULT_MAX_GAS_L1 = 5000;
const DEFAULT_MAX_GAS_PRICE_L1 = 400;
const HEX_ZERO = '0x0';

const CHECK_TX_UPDATE_TIMEOUT = 3000;
// const TOKENS_CONFIG_KEY = ConfigKey.OptimismTokens;
// const BANNED_TOKENS_CONFIG_KEY = ConfigKey.OptimismTokensBanned;

const WEB3_SDK = 'web3Sdk';
const ETHEREUM_JS_WALLET_SDK = 'ethereumJsWalletSdk';

/**
 * @class OPCoin
 * @TODO Add Mixins to implement nft, stakes. @See ETHCoin.
 */
class OPCoin extends Web3Mixin(HasProviders(HasTokensMixin(Coin))) {
  #privateKey;

  /** @type {string} */
  web3BaseUrl;
  /** @type {import('web3').default|null} */
  coreLibrary = null;

  /**
   * constructs the object.
   *
   * @param  {string} alias the alias
   * @param  {object} feeData the fee data
   * @param  {Explorer[]}  explorers the explorers
   * @param  {string} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      l2Name: ID,
      ticker: TICKER,
      network: ID,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      txWebUrl,
      explorers,
      socket,
      feeData,
      chainId: OP_CHAIN_ID,
      dependencies: {
        [WEB3_SDK]: new LazyLoadedLib(() => import('web3')),
        [ETHEREUM_JS_WALLET_SDK]: new LazyLoadedLib(
          () => import('ethereumjs-wallet'),
        ),
      },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([
      Web3Explorer,
      EtherscanExplorer,
      CovalentHQExplorer,
    ]);

    this.loadExplorers(config);

    this.setFeeData(feeData);

    this.gasPriceConfig = null;
    this.bannedTokens = [];

    const web3Params = explorers.find(
      ({ className }) => className === 'Web3Explorer',
    );

    this.web3BaseUrl = web3Params.baseUrl;

    this.fields.paymentId = false;
    this.tokens = {};
    this.nonce = new this.BN('0');

    this.eventEmitter.on(
      `${this.ticker}::confirmed-socket-tx`,
      (coinId, unconfirmedTx, ticker) => {
        this.eventEmitter.emit('socket::tx::confirmed', { id: coinId, ticker });
      },
    );
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
    this.gasLimit = Number(feeData.gasLimit);
    this.stakingGasLimit = Number(feeData.stakingGasLimit) || DEFAULT_MAX_GAS; // @TODO replace by estimated gasLimit in future
    this.nftGasLimitCoefficient = Number(feeData.nftGasLimitCoefficient);
    this.nftGasPriceCoefficient = Number(feeData.nftGasPriceCoefficient);
    this.gasLimitCoefficient = Number(feeData.gasLimitCoefficient);
    this.gasPriceCoefficient = Number(feeData.gasPriceCoefficient);
    this.defaultGasPrice = Number(feeData.defaultGasPrice);
    this.defaultMaxGasPrice = Number(feeData.defaultMaxGasPrice);
    this.resendTimeout = feeData.resendTimeout;
    this.maxGasLimitL1 = Number(feeData.maxGasLimitL1) || DEFAULT_MAX_GAS_L1;
    this.maxGasPriceL1 =
      Number(feeData.maxGasPriceL1) || DEFAULT_MAX_GAS_PRICE_L1;
  }

  isFeeDynamic() {
    return true;
  }

  async getTransactions() {
    if (!this.address) {
      throw new Error(`${TICKER}: getTransactions: address is not loaded`);
    }

    // @TODO Check for failed transactions (@see ETHCoin)
    const [transactions, { tokenTransactions: rawTokenTransactions }] =
      await Promise.all(
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
    const [coreLibrary, { hdkey }] = await Promise.all([
      this.getCoreLibrary(),
      this.loadLib(ETHEREUM_JS_WALLET_SDK),
    ]);
    const ethHDKey = hdkey.fromMasterSeed(seed);
    const wallet = ethHDKey.getWallet();
    const account = coreLibrary.eth.accounts.privateKeyToAccount(
      wallet.getPrivateKeyString(),
    );

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
   * @param {String} address The address
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
    // To send OP coins, we must use exactly 21000 units of gas (DEFAULT_MIN_GAS),
    // otherwise it will break the "send all".
    const gas = paymentData ? gasLimit || this.gasLimit : DEFAULT_MIN_GAS;

    // This has a higher priority than userGasPrice
    let sendAllGasPrice;
    let value = amount;

    if (!paymentData && isSendAll && userFee) {
      const evaluatedFeeL1 = await this.getCoinFeeL1FromOracle();
      const requiredFeeL2 = new this.BN(userFee).sub(evaluatedFeeL1);

      sendAllGasPrice = Math.floor(
        new this.BN(requiredFeeL2).div(new this.BN(gas)).toNumber(),
      );
      value = Number(amount) - UNSPENDABLE_BALANCE_FOR_SEND_ALL;
    }
    const gasPrice =
      sendAllGasPrice || userGasPrice || (await this.getGasPrice());

    const transaction = {
      to: address,
      value,
      gas,
      chainId: OP_CHAIN_ID,
      gasPrice,
      nonce: nonce || (await this.getNonce()),
    };

    if (paymentData !== '' && paymentData !== null) {
      transaction.data = paymentData;
    }

    const coreLibrary = await this.getCoreLibrary();
    const signedTx = await coreLibrary.eth.accounts.signTransaction(
      transaction,
      this.#privateKey,
    );

    return signedTx.rawTransaction;
  }

  _getTransferTokenContractData(contract, to, amount) {
    return this.getProvider('send').createSendTokenContract(
      contract,
      this.address,
      to,
      amount,
    );
  }

  async createTokenTransaction({
    address,
    amount,
    custom,
    userGasPrice,
    gasLimit,
    contract,
    multiplier,
  }) {
    const contractData = this._getTransferTokenContractData(
      contract,
      address,
      amount,
    );

    return this.createTransaction({
      address: contract,
      amount: HEX_ZERO,
      paymentData: contractData,
      userGasPrice,
      gasLimit: gasLimit || (await this.estimateGas(amount, address)),
      multiplier,
    });
  }

  /**
   * Send transacrion and increase nonce by 1
   * @async
   * @param rawtx
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
    try {
      const { node: rawGasPrice } =
        (await this.getProvider('node').getGasPrice()) ?? {};
      const gasPrice = Number(rawGasPrice) + coefficient * GWEI;
      const defaultMaxGasPriceInGwei = this.defaultMaxGasPrice * GWEI;

      return gasPrice > defaultMaxGasPriceInGwei
        ? defaultMaxGasPriceInGwei
        : gasPrice;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets gas limit from node
   *
   * @param {string} address - Wallet address.
   * @param {string} toContract - NFT contract address.
   * @param {string} data - Encoded token ABI data.
   * @param {number} [gasLimitCoefficient = 1] - Custom coefficient for tune gas limit.
   * @returns {Promise<number>}
   * @throws {ExternalError}
   */
  async estimateGasForSendNft(
    address,
    toContract,
    data,
    gasLimitCoefficient = 1,
  ) {
    try {
      /** @type number */
      const fetchedGasLimit = await this.getProvider('nft-send').estimateGas(
        address,
        toContract,
        null,
        data,
      );

      return Math.ceil(fetchedGasLimit * gasLimitCoefficient);
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
   * @param {string} toContract - The NFT contract address.
   * @param {string} data - Contract encoded data.
   * @param {UserFeeOptions} userOptions - Custom user options.
   * @returns {Promise<{gasLimit: number, gasPrice: number, nonce: number}>}
   */
  async getNftTransferGasParams(
    toContract,
    data,
    { userGasPrice, userGasLimit },
  ) {
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
    const gasPriceCoefficient =
      nftGasPriceCoefficient || configGasPriceCoefficient;
    /** @type number */
    const gasLimitCoefficient =
      nftGasLimitCoefficient || configGasLimitCoefficient;

    const defaultGasValues = [
      (defaultGasPrice + gasPriceCoefficient) * GWEI,
      Math.ceil(coinGasLimit * gasLimitCoefficient),
    ];

    const nonce = (await this.getNonce()).toNumber();

    const [gasPrice, gasLimit] = await Promise.allSettled([
      userGasPrice || this.getGasPriceForSendNft(gasPriceCoefficient),
      userGasLimit ||
        this.estimateGasForSendNft(
          address,
          toContract,
          data,
          gasLimitCoefficient,
        ),
    ]).then((resultList) =>
      resultList.map((result, i) => {
        return result.status === 'fulfilled'
          ? result.value
          : defaultGasValues[i];
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
  async getNftFee({
    contractAddress,
    tokenId,
    tokenStandard,
    toAddress = null,
    userOptions = {},
  }) {
    const targetAddress =
      !toAddress || toAddress.toLowerCase() === this.address.toLowerCase()
        ? MOCKED_OP_ADDRESS
        : toAddress;

    try {
      const data = await this.getProvider('nft-send').getNftContractData(
        this,
        targetAddress,
        contractAddress,
        tokenId,
        tokenStandard,
      );
      const { gasLimit, gasPrice } = await this.getNftTransferGasParams(
        contractAddress,
        data,
        userOptions,
      );

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
      const { gasLimit, gasPrice, nonce } = await this.getNftTransferGasParams(
        contractAddress,
        data,
        userOptions,
      );
      const transaction = {
        to: contractAddress,
        value: HEX_ZERO,
        gas: gasLimit,
        data,
        nonce,
        // EIP-1559
        maxFeePerGas: gasPrice,

        // Here the old way - non EIP-1559
        // gasPrice,
      };

      const coreLibrary = await this.getCoreLibrary();
      const { rawTransaction } = await coreLibrary.eth.accounts.signTransaction(
        transaction,
        this.#privateKey,
      );

      return rawTransaction;
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  async getNonce() {
    const coreLibrary = await this.getCoreLibrary();

    this.nonce = new this.BN(
      await coreLibrary.eth.getTransactionCount(this.address),
    );
    return this.nonce;
  }

  /**
   * @param {string} data
   * @returns {Promise<BN>}
   */
  async _getFeeL1FromOracle(data) {
    const coreLibrary = await this.getCoreLibrary();
    const gasPriceOracleContract = new coreLibrary.eth.Contract(
      ovmGasPriceOracleAbi,
      OVM_GAS_PRICE_ORACLE_CONTRACT_ADDRESS,
    );
    const feeL1FromOracle = await gasPriceOracleContract.methods
      .getL1Fee(data)
      .call()
      .catch(async (error) => {
        // logger.error({ instance: this, error });
        return new this.BN(this.maxGasLimitL1)
          .mul(new this.BN(await this._getGasPriceL1FromConfig()))
          .mul(new this.BN(GWEI));
      });

    return new this.BN(String(feeL1FromOracle));
  }

  /**
   * Gets gas price L1 from ETH network
   * @returns {Promise<number>}
   */
  async _getGasPriceL1FromConfig() {
    const { fast } = await configManager
      .get(ConfigKey.EthereumGasPrice)
      .catch(() => {
        return this.maxGasPriceL1;
      });

    return fast;
  }

  /**
   * @returns {Promise<number>}
   */
  getCoinFeeL1FromOracle() {
    return this._getFeeL1FromOracle(EMPTY_OVM_GAS_PRICE_ORACLE_CONTRACT);
  }

  /**
   * @returns {Promise<number>}
   */
  getTokenFeeL1FromOracle(contract, amount) {
    const contractData = this._getTransferTokenContractData(
      contract,
      MOCKED_OP_ADDRESS,
      amount,
    );

    return this._getFeeL1FromOracle(contractData);
  }

  /**
   * @typedef UserFeeOptions
   * @type {object}
   * @property {string | null} [userGasPrice=null] - Custom gas price.
   * @property {string | null} [gasLimit=null] - Custom gas limit.
   */

  /**
   * Gets the estimated fee for the transaction
   *
   * @param {UserFeeOptions} [options] - Custom priority
   * @param {string} [options.contract=null] - Custom priority
   * @param {number} [options.amount=1] - Custom priority
   * @returns {Promise<BN>}
   */
  async getFee({
    userGasPrice = null,
    gasLimit = null,
    contract = null,
    amount = 1,
  } = {}) {
    const gasPriceL2 = userGasPrice || (await this.getGasPrice());
    const requiredGas =
      gasLimit ||
      (contract
        ? await this.estimateGas(amount, null, contract, this.gasLimit)
        : this.gasLimit);
    const feeL2 = new this.BN(gasPriceL2).mul(new this.BN(requiredGas));

    const feeL1 = contract
      ? await this.getTokenFeeL1FromOracle(contract, amount)
      : await this.getCoinFeeL1FromOracle();

    return new this.BN(feeL1).add(feeL2);
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

    const gasPrice =
      Number(rawGasPrice?.toString()) || this.defaultGasPrice * GWEI;

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
   * @param {string} address - Destination address.
   * @param {string} contract - Contract address.
   * @param {number} defaultGas
   * @returns {Promise<number>}
   */
  async estimateGas(amount, address, contract, defaultGas = DEFAULT_MAX_GAS) {
    const erc20Abi = this.getProvider('send').getERC20ABI();
    const coreLibrary = await this.getCoreLibrary();
    const tokenContract = new coreLibrary.eth.Contract(erc20Abi, contract);
    const estimatedGas = await tokenContract.methods
      .transfer(MOCKED_OP_ADDRESS, amount)
      .estimateGas({ from: this.address })
      .catch((error) => {
        // Some token contracts may return error: execution reverted: insufficient-balance
        // logger.error({ instance: this, error });
        return defaultGas;
      });

    return Math.round(estimatedGas * this.gasLimitCoefficient);
  }

  /**
   * Gets available balance for send in OP
   *
   * @param {string|number|BN} fee - Custom fee in WEI.
   * @return {Promise<string>}
   */
  async availableBalance(fee) {
    if (!this.balance) {
      return null;
    }

    const maximumFee = (fee && new this.BN(fee)) || (await this.getFee());
    const availableBalance = new this.BN(this.balance)
      .sub(maximumFee)
      .sub(new this.BN(this.unspendableBalance));

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
      const tokenBalance = await this.getProvider(
        'node',
      ).getTokenBalanceByContractAddress({
        address: this.address,
        contractAddress: tokenInfo.contract.toLowerCase(),
      });

      const contractVariant = [
        tokenInfo.contract,
        tokenInfo.contract.toLowerCase(),
      ];

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
   * @return {OPToken}
   */
  createToken(args) {
    return new OPToken({
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
   * Returns all token list data
   * @returns {Promise<Array>}
   */
  async getTokenList() {
    this.bannedTokens = await this.getBannedTokenList();
    let tokens;

    // try {
    //   tokens = await configManager.get(TOKENS_CONFIG_KEY);
    // } catch (error) {
    //   // logger.error({ instance: this, error });
    // }

    return tokens || TOKENS_CACHE;
  }

  /**
   * Returns banned token list data
   * @returns {Promise<Array>}
   */
  async getBannedTokenList() {
    let banned;

    // try {
    //   banned = await configManager.get(BANNED_TOKENS_CONFIG_KEY);
    // } catch (error) {
    //   // logger.error({ instance: this, error });
    // }

    return banned || BANNED_TOKENS_CACHE;
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
      ...token,
      source,
      visibility: true,
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
      source,
      visibility: token.visibility !== false,
      confirmed: token.confirmed,
      notify: Boolean(token.notify),
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

export default OPCoin;
