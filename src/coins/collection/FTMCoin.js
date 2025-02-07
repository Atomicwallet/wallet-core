import { Coin } from 'src/abstract';
import { NftMixin } from 'src/coins/nfts/mixins';
import { ExternalError } from 'src/errors';
import ETHNftExplorer from 'src/explorers/collection/ETHNftExplorer';
import FtmExplorer from 'src/explorers/collection/FtmExplorer';
import MoralisExplorer from 'src/explorers/collection/MoralisExplorer';
import Web3Explorer from 'src/explorers/collection/Web3Explorer';
import Transaction from 'src/explorers/Transaction';
import BANNED_TOKENS_CACHE from 'src/resources/ftm/tokens-banned.json';
import TOKENS_CACHE from 'src/resources/ftm/tokens.json';
import { FTMToken } from 'src/tokens';
import { getTokenId, Amount, LazyLoadedLib } from 'src/utils';
import { ConfigKey } from 'src/utils/configManager';
import { EXTERNAL_ERROR } from 'src/utils/const';
import { toCurrency } from 'src/utils/convert';

import HasProviders from '../mixins/HasProviders';
import HasTokensMixin from '../mixins/HasTokensMixin';
import Web3Mixin from '../mixins/Web3Mixin';

const NAME = 'Fantom';
const TICKER = 'FTM';
const DERIVATION = "m/44'/1007'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const FANTOM_CHAIN_ID = 250;
// const FTM_MODERATED_GAS_PRICE_URL = ConfigKey.FantomGasPrice;
const MODERATED_GAS_PRICE_URL_TIMEOUT = 10000;
const GWEI = 1000000000;

// Public key from a compromised mnemonic used for unit tests
const MOCKED_FTM_ADDRESS = '0x29625E10Cfe090294DC0eC579E322ce87C822745';

const DEFAULT_MIN_GAS = 21000;
const DEFAULT_MAX_GAS = 150000;
const HEX_ZERO = '0x0';

const LIDO_REF_ADDR = '0xF07A4a4d2fDE367A55FaC93761ecc8181148b826';

const CHECK_TX_UPDATE_TIMEOUT = 3000;

const WEB3_SDK = 'web3Sdk';
const ETHEREUM_JS_WALLET_SDK = 'ethereumJsWalletSdk';

/**
 * @class FTMCoin
 * @TODO Add Mixins to implement nft, stakes. @See ETHCoin.
 */
class FTMCoin extends Web3Mixin(NftMixin(HasProviders(HasTokensMixin(Coin)))) {
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
  constructor(config, db, configManager) {
    super(
      {
        ...config,
        name: config.name ?? NAME,
        ticker: config.ticker ?? TICKER,
        decimal: DECIMAL,
        unspendableBalance: UNSPENDABLE_BALANCE,
        dependencies: {
          [WEB3_SDK]: new LazyLoadedLib(() => import('web3')),
          [ETHEREUM_JS_WALLET_SDK]: new LazyLoadedLib(() => import('ethereumjs-wallet')),
        },
      },
      db,
      configManager,
    );

    this.derivation = DERIVATION;

    this.setExplorersModules([Web3Explorer, FtmExplorer, MoralisExplorer, ETHNftExplorer]);

    this.loadExplorers(config);

    const { feeData, explorers, txWebUrl } = config;

    this.setFeeData(feeData);

    this.balance = '0';
    this.gasPriceConfig = null;
    this.bannedTokens = [];

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

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.gasLimit = Number(feeData.gasLimit);
    // @TODO replace by estimated gasLimit in future
    this.stakingGasLimit = Number(feeData.stakingGasLimit) || DEFAULT_MAX_GAS;
    this.nftGasLimitCoefficient = Number(feeData.nftGasLimitCoefficient);
    this.nftGasPriceCoefficient = Number(feeData.nftGasPriceCoefficient);
    this.gasLimitCoefficient = Number(feeData.gasLimitCoefficient);
    this.gasPriceCoefficient = Number(feeData.gasPriceCoefficient);
    this.defaultGasPrice = Number(feeData.defaultGasPrice);
    this.defaultMaxGasPrice = Number(feeData.defaultMaxGasPrice);
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
    const [transactions, { nftTransactions = [] }, { rawTokenTransactions = [] }] = await Promise.all(
      [
        this.getProvider('history').getTransactions({ address: this.address }),
        this.getProvider('nft-history').getNftTransactions({
          address: this.address,
        }),
        this.getProvider('token').getRawTokenTransactions({
          address: this.address,
        }),
      ].map((promise) => promise.catch(() => [])),
    );

    const tokenTransactions = rawTokenTransactions.reduce((txs, rawTx) => {
      const contract = rawTx.contract.toLowerCase();
      const token = this.tokens[contract];

      const isKnownToken = !!token;
      const ticker = token?.ticker ?? rawTx.ticker;

      txs.push(
        new Transaction({
          ...rawTx,
          ticker,
          name: token?.name ?? rawTx.name,
          walletid: getTokenId({ ticker, contract, parent: this.ticker }),
          amount: isKnownToken ? toCurrency(rawTx.value, Number(token.decimal)) : null,
        }),
      );
      return txs;
    }, []);

    return transactions.concat(nftTransactions).concat(tokenTransactions);
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
   * Get FTM fee settings
   * @return {Promise<Object>} The FTM fee settings
   */
  getFeeSettings() {
    // @TODO implement fetch moderated gas config
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
   * @param {number} [multiplier=this.gasPriceCoefficient] - Gas price coefficient.
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
    multiplier = this.gasPriceCoefficient,
    gasLimit,
    paymentData = null,
  }) {
    let gasPriceIncremented;

    if (!userGasPrice) {
      const gasPrice = isSendAll && userFee ? Number(userFee) / Number(this.gasLimit) : await this.getGasPrice();

      // @TODO Possible wrong implementation which uses multiplication instead of addition.
      // Also @See getGasPrice method
      // @TODO If the gasPriceCoefficient parameter in the fee config is set to zero, then an error will
      //  occur here due to the zero gas price
      gasPriceIncremented = Number(gasPrice.toString()) * multiplier;
    }

    // To send FTM coins, we must use exactly 21000 units of gas, otherwise it will break the "send all".
    const gas = paymentData ? gasLimit || this.gasLimit : DEFAULT_MIN_GAS;

    const [coreLibrary] = await Promise.all([this.getCoreLibrary(), this.getNonce()]);
    const transaction = {
      to: address,
      value: amount,
      gas,
      chainId: FANTOM_CHAIN_ID,
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

    return tx;
  }

  /**
   * Sets status to 1 to mark transaction as completed.
   * Borrowed from Web3Explorer.
   *
   */
  async checkTransaction(txInfo) {
    const { coin, address, amount, memo, txid, nonce, fee, feeTicker } = txInfo;

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
        feeTicker: feeTicker ?? coin.feeTicker ?? this.ticker,
      });

      const db = this.getDbTable('transactions');

      await db.put(newTx);

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
    const { node: rawGasPrice } = (await this.getProvider('node').getGasPrice()) ?? {};
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
   * @throws {ExternalError}
   */
  async estimateGasForSendNft(address, toContract, data, gasLimitCoefficient = 1) {
    try {
      /** @type number */
      const fetchedGasLimit = await this.getProvider('nft-send').estimateGas(address, toContract, null, data);

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
      !toAddress || toAddress.toLowerCase() === this.address.toLowerCase() ? MOCKED_FTM_ADDRESS : toAddress;

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
        maxFeePerGas: gasPrice,

        // Here the old way - non EIP-1559
        // gasPrice,
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
   * @typedef UserFeeOptions
   * @type {object}
   * @property {string | null} [userGasPrice=null] - Custom gas price.
   * @property {string | null} [gasLimit=null] - Custom gas limit.
   */

  /**
   * Gets the estimated fee for the transaction
   *
   * @param {UserFeeOptions} [userOptions] - Custom priority
   * @returns {Promise<BN>}
   */
  async getFee({ userGasPrice = null, gasLimit = null } = {}) {
    const gasPrice = userGasPrice || (await this.getGasPrice());

    return new this.BN(String(gasPrice)).mul(new this.BN(gasLimit || this.gasLimit));
  }

  /**
   * Gets gas price in WEI
   * @TODO Use a moderatedGasPrice after the service is implemented
   * @TODO @See ETHCoin implementation
   *
   * @returns {Promise<number>}
   */
  async getGasPrice() {
    const { node: rawGasPrice } = await this.getProvider('node')
      .getGasPrice()
      .catch((error) => {
        console.warn(`rawGasPrice for ${NAME} error:`, error);
      });

    return Number(rawGasPrice ?? this.defaultGasPrice * GWEI) + this.gasPriceCoefficient * GWEI;
  }

  /**
   * Gets moderate gas prices from Eth Gas station
   *
   * @returns {Promise<{standard: BN, fastest: BN} | {}>}
   */
  async getModerateGasPrice() {
    // @TODO implement fetch moderated gas config

    return {};
  }

  async estimateGas(amount, address, contract, defaultGas = DEFAULT_MAX_GAS) {
    const tokenSendData = this.getProvider('send').createSendTokenContract(
      contract,
      this.address,
      MOCKED_FTM_ADDRESS,
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
   * Gets available balance for send in FTM
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

    // @TODO To be used in future Fantom implementation
    // await this.getStakingInfo()

    return { balance: info.balance, balances: this.balances };
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
         * But at this point we ensure that every staking smart-contract have same decimals as FTM
         * and their value is 1:1 to FTM
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
    // total balance is equal to actual FTM  balance + staked;
    // this valid while we use staking through third-party smart-contracts
    // with same decimals, and if their value is 1:1 to FTM

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
   * @param amount amount in FTM
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
   * @param {object} args - The arguments
   * @return {FTMToken}
   */
  createToken(args) {
    return new FTMToken(
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

    const tokens = await this.configManager.get(ConfigKey.FantomTokens);

    return tokens ?? TOKENS_CACHE;
  }

  /**
   * Returns banned token list data
   * @returns {Promise<Array>}
   */
  async getBannedTokenList() {
    const banned = await this.configManager.get(ConfigKey.FantomTokensBanned);
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
      source,
      visibility: true,
      confirmed: token.confirmed,
      // The 'notify' field is for Atomic's internal use, explorers (the source of the 'user list') does not have it.
      // But we don't need to change this value, as it can be set in the native token list for this token.
      notify: token.notify,
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

export default FTMCoin;
