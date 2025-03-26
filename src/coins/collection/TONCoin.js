import { Coin } from 'src/abstract';
import { ExternalError, UnknownConfigKeyError } from 'src/errors';
import TonwebExplorer from 'src/explorers/collection/TonwebExplorer';
import { TONToken } from 'src/tokens';
import { LazyLoadedLib, logger } from 'src/utils';
import { ConfigKey } from 'src/utils/configManager';
import { EXTERNAL_ERROR } from 'src/utils';

import { HasProviders, HasTokensMixin } from '../mixins';
import {
  BALANCE_PROVIDER_OPERATION,
  SEND_PROVIDER_OPERATION,
  TOKEN_PROVIDER_OPERATION,
  TONWEB_PROVIDER_OPERATION,
} from '../mixins/HasProviders';

const tonwebLib = new LazyLoadedLib(() => import('tonweb'));
const tonwebMnemonicLib = new LazyLoadedLib(() => import('tonweb-mnemonic'));

const NAME = 'Toncoin';
const TICKER = 'TON';
const DECIMAL = 9;
const UNSPENDABLE_BALANCE = '10000000';
const FALLBACK_FEE_RESERVE = 1000000;
const TOKEN_CONTRACT_TRANSFER_FEE = '0.05';
const CHECK_TX_UPDATE_TIMEOUT = 3000;

/**
 * The Open Network
 *
 * @class TONCoin
 */
class TONCoin extends HasProviders(HasTokensMixin(Coin)) {
  #privateKey;

  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, isTestnet, id }, db, configManager) {
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
    };

    super(config, db, configManager);

    this.setExplorersModules([TonwebExplorer]);

    this.loadExplorers(config);

    this.isTestnet = isTestnet;
    this.fields.paymentId = true;

    /** @type {{ [id: string]: TONToken }} */
    this.tokens = {};
    /** @type {string[]} */
    this.bannedTokens = [];

    this.tokenContractTransferFee = feeData?.tokenContractTransferFee ?? TOKEN_CONTRACT_TRANSFER_FEE;
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed, phrase) {
    const { default: TonWeb } = await tonwebLib.get();
    const { mnemonicToKeyPair } = await tonwebMnemonicLib.get();
    const keys = await mnemonicToKeyPair(phrase.split(' '));

    this.keys = keys;
    this.#privateKey = TonWeb.utils.bytesToHex(keys.secretKey);

    const tonweb = new TonWeb(this.getProvider(TONWEB_PROVIDER_OPERATION).provider);

    this.wallet = await tonweb.wallet.create({ publicKey: keys.publicKey });
    this.address = (await this.wallet.getAddress(keys.publicKey)).toString(true, true, true);

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Gets the fee.
   *
   * @return {Promise<BN>} The fee.
   */
  async getFee({ address, sendAmount, custom = '' } = {}) {
    const { default: TonWeb } = await tonwebLib.get();
    const seqno = await this.getSeqno();

    const amount = sendAmount || this.balance.toString();

    const estimation = await this.wallet.methods
      .transfer({
        secretKey: this.keys.secretKey,
        toAddress: address
          ? new TonWeb.utils.Address(address).toString(true, true, false)
          : 'EQCKj9RrtWJhvbVwIWDYg2MBIEoiy0G2qzotgHhqaJQb6ztu',
        // needed valid address to create fake transfer for estimation
        amount,
        seqno: seqno || 0,
        payload: custom,
      })
      .estimateFee();

    const feeReserve = Number(this.feeData?.reserveForSend) || FALLBACK_FEE_RESERVE;

    const result = new this.BN(
      Object.values(estimation.source_fees).reduce((prev, cur) => (cur !== 'fees' ? prev + cur : prev), feeReserve),
    );

    return result;
  }

  getTransactionExpirationTimeout() {
    return Math.floor(Date.now() / 1000) + 360;
  }

  getSeqno() {
    return this.wallet.methods.seqno().call();
  }

  /**
   * Creates a transaction.
   *
   * @param {string} address The destination address
   * @param {number} amount The amount to send
   * @return {Promise<string>} Raw transaction
   */
  async createTransaction({ address, amount, memo }) {
    const { default: TonWeb } = await tonwebLib.get();

    if (!this.state) {
      try {
        await this.wallet.deploy(TonWeb.utils.hexToBytes(this.#privateKey)).send();
      } catch (error) {
        logger.log({ instance: this, error });
      }
    }

    let seqno = await this.getSeqno();

    while (!this.state && !seqno) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      seqno = await this.getSeqno();
    }

    const transfer = this.wallet.methods.transfer({
      secretKey: this.keys.secretKey,
      toAddress: new TonWeb.utils.Address(address).toString(true, true, false),
      amount,
      seqno,
      payload: memo,
      expireAt: this.getTransactionExpirationTimeout(),
    });

    const query = await transfer.getQuery();

    const boc = TonWeb.utils.bytesToBase64(await query.toBoc(false));

    return boc;
  }

  async setPrivateKey(privateKey, mnemonic) {
    return this.loadWallet(null, mnemonic);
  }

  async getInfo(props) {
    if (props?.isToken) {
      const tokenBalance = await this.getTokenInfo({ mint: props.mint });

      const contractVariant = [props.contract, props.contract.toLowerCase()];

      contractVariant.forEach((contract) => {
        if (this.tokens[contract] && tokenBalance) {
          this.tokens[contract].balance = tokenBalance;
        }
      });
    }

    const { state, balance } =
      (await this.getProvider(BALANCE_PROVIDER_OPERATION).getState(this.address).catch()) ?? {};

    if (balance) {
      this.balance = balance;
    }
    this.state = state === 'active';

    if (!props?.onlyCoin) {
      const tokens = Object.values(this.tokens);

      tokens.forEach((token) => {
        token.getInfo();
      });
    }

    return { balance: this.balance };
  }

  async getBalance() {
    return this.getProvider(BALANCE_PROVIDER_OPERATION).getBalance();
  }

  async validateAddress(address) {
    const { default: TonWeb } = await tonwebLib.get();

    return TonWeb.utils.Address.isValid(address);
  }

  async sendTransaction(tx) {
    const response = await this.getProvider(SEND_PROVIDER_OPERATION).sendTransaction(tx);

    return { txid: response?.hash };
  }

  /**
   * @typedef ConfigTokenShape
   * @type {object}
   * @property {string} name
   * @property {string} ticker
   * @property {number} decimal
   * @property {string} contract
   * @property {boolean} visibility
   *
   */

  /**
   * Returns all token list data
   *
   * @returns {Promise<ConfigTokenShape[]>}
   */
  async getTokenList() {
    this.bannedTokens = await this.getBannedTokenList();

    const tokens = await this.configManager.get(ConfigKey.TonTokens);

    return tokens ?? [];
  }

  /**
   * Returns banned token list
   *
   * @async
   * @returns {Promise<string[]>} - Array of contract addresses
   */
  async getBannedTokenList() {
    const banned = await this.configManager?.get(ConfigKey.TonTokensBanned);

    return banned ?? [];
  }

  /**
   * @typedef ExplorerTokenShape
   * @type {object}
   * @property {string} name
   * @property {string} ticker
   * @property {number} decimal
   * @property {string} contract
   * @property {string} parentTicker
   * @property {string} uniqueField
   * @property {string[]} supportedStandards
   *
   */

  /**
   * Returns user token list data
   * @TODO Not implemented yet
   * @returns {Promise<ExplorerTokenShape[]>}
   */
  async getUserTokenList() {
    return [];
  }

  /**
   * Maps from common token list to internal token format
   * @returns {Promise<Array>}
   */
  getTokenFromCommonList(token, source) {
    return {
      name: token.name,
      ticker: token.symbol,
      decimal: token.decimal || 0,
      contract: token.mint.toLowerCase(),
      parentTicker: this.ticker,
      uniqueField: token.mint.toLowerCase(),
      visibility: token.visibility !== false,
      confirmed: token.confirmed,
      source: token.source || source,
      notify: Boolean(token.notify),
      mint: token.mint,
    };
  }

  /**
   * Creates a token.
   *
   * @param {object} args - The arguments.
   * @return {TONToken}
   */
  createToken(args) {
    return new TONToken(
      {
        parent: this,
        ...args,
      },
      this.db,
      this.configManager,
    );
  }

  /**
   * Gets token balance
   *
   * @param {string} mint - Token contract address.
   * @returns {Promise<string|null>}
   */
  getTokenInfo({ mint }) {
    return this.getProvider(TOKEN_PROVIDER_OPERATION).getTokenBalance({
      address: this.address,
      mint,
    });
  }

  /**
   * Creates a token transaction.
   *
   * @param {object} params - The parameters for creating the token transaction.
   * @param {string} params.mint - The address of the mint.
   * @param {string} params.address - The address to send the tokens to.
   * @param {number} params.amount - The amount of tokens to transfer.
   * @returns {Promise<string>} - Raw transaction - base64 representation (boc).
   * @throws {ExternalError} - Throws an ExternalError if there was an error creating the token transaction.
   */
  async createTokenTransaction({ mint, address, amount }) {
    try {
      const { default: TonWeb } = await tonwebLib.get();
      const provider = this.getProvider(TONWEB_PROVIDER_OPERATION).provider;
      const tonweb = new TonWeb(provider);
      const WalletClass = tonweb.wallet.all.v3R1;
      const wallet = new WalletClass(provider, {
        publicKey: this.keys.publicKey,
      });
      const walletAddress = new TonWeb.utils.Address(this.address);
      const jettonMinter = new TonWeb.token.jetton.JettonMinter(provider, {
        address: mint,
      });
      const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(walletAddress);
      const jettonWallet = new TonWeb.token.jetton.JettonWallet(provider, {
        address: jettonWalletAddress,
      });
      const seqno = (await this.getSeqno()) || 0;
      const payload = await jettonWallet.createTransferBody({
        queryId: seqno,
        jettonAmount: amount,
        toAddress: new TonWeb.utils.Address(address),
        responseAddress: walletAddress,
      });

      const fee = TonWeb.utils.toNano(this.tokenContractTransferFee);

      const transfer = await wallet.methods.transfer({
        toAddress: jettonWalletAddress,
        amount: fee,
        seqno,
        payload,
        secretKey: this.keys.secretKey,
      });

      const query = await transfer.getQuery();

      return TonWeb.utils.bytesToBase64(await query.toBoc(false));
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  async checkTransaction(txInfo) {
    const { wallet } = txInfo;

    if (wallet instanceof TONToken) {
      setTimeout(async () => {
        try {
          await wallet.getInfo();
          this.eventEmitter.emit('socket::newtx::outgoing', {
            id: wallet.id,
            ticker: txInfo.wallet.ticker,
          });
        } catch (error) {
          console.warn(this.ticker, 'Unable to check transaction');
        }
      }, CHECK_TX_UPDATE_TIMEOUT);
      return;
    }

    await super.checkTransaction(txInfo);
  }

  async getTransactions(args) {
    try {
      if (!this.address) {
        throw new Error(`[${this.ticker}] getTransactions error: address is not loaded`);
      }

      return this.getProvider('history').getTransactions({
        ...args,
        address: this.address,
      });
    } catch (error) {
      logger.log({ instance: this, error });
      return this.transactions || [];
    }
  }

  /**
   * Gets token transaction list
   *
   * @param {string} contract - Contract address.
   * @returns {Promise<Transaction[]>}
   */
  getTokenTransactions({ jettonWalletAddress }) {
    if (!jettonWalletAddress) {
      throw new Error(`${this.ticker}: \`jettonWalletAddress\` parameter should be defined`);
    }

    return this.getProvider('token').getTokenTransactions({
      jettonWalletAddress,
    });
  }

  /**
   * Gets the jetton wallet address for the specified jetton mint address.
   *
   * @async
   * @param {string} jettonMintAddress - The address of the jetton mint.
   * @returns {Promise<string>} - The jetton wallet address.
   */
  getJettonWalletAddress(jettonMintAddress) {
    return this.getProvider('token').getJettonWalletAddress(this.address, jettonMintAddress);
  }
}

export default TONCoin;
