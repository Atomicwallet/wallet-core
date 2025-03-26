import { Coin } from 'src/abstract';
import { ExternalError } from 'src/errors';
import AptExplorer from 'src/explorers/collection/AptExplorer';
import { LazyLoadedLib, EXTERNAL_ERROR } from 'src/utils';

import HasProviders from '../mixins/HasProviders';

const NAME = 'Aptos';
const TICKER = 'APT';
const DECIMAL = 8;
const DERIVATION = "m/44'/637'/0'/0'/0'";
const UNSPENDABLE_BALANCE = '0';

const APTOS_TRANSFER_MODULE_NAME = '0x1::aptos_account';
const APTOS_TRANSFER_FUNCTION_NAME = 'transfer';
const APTOS_MAINNET_CHAIN_ID = 1;
const DEFAULT_GAS_PRICE = 100;
const DEFAULT_MAX_GAS_PRICE = 1000;
const DEFAULT_GAS_LIMIT = 2000;
const DEFAULT_EXPIRATION_TIMEOUT = 30;
const APTOS_SDK = 'aptosSdk';

/**
 * @typedef LocalAccount
 * @property {AptosAccount | undefined} account - Local aptos account.
 * @property {boolean = false} isRegistered - The sign that the account is registered on the blockchain.
 */

class APTCoin extends HasProviders(Coin) {
  /** @type string | undefined */
  #privateKey;
  /** @type string | undefined */
  publicKey;
  /** @type LocalAccount */
  #localAccount = {
    account: undefined,
    isRegistered: false,
  };

  /** @type number | undefined */
  #defaultGasPrice;
  /** @type number | undefined */
  #gasPriceCoefficient;
  /** @type number | undefined */
  #defaultMaxGasPrice;
  /** @type number | undefined */
  #gasLimit;
  /** @type number | undefined */
  #gasLimitCoefficient;
  /** @type number  */
  #txExpirationTimeout;

  constructor({ alias, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
    const config = {
      id,
      alias,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      explorers,
      txWebUrl,
      socket,
      feeData,
      dependencies: {
        [APTOS_SDK]: new LazyLoadedLib(() => import('aptos')),
      },
    };

    super(config, db, configManager);

    this.setExplorersModules([AptExplorer]);

    this.loadExplorers(config);

    this.derivation = DERIVATION;
    this.setFeeData(feeData);
  }

  /**
   * @typedef AptosSdk
   * @type {object}
   * @property {import('aptos').AptosAccount} AptosAccount
   * @property {import('aptos').AptosClient} AptosClient
   * @property {import('aptos').BCS} BCS
   * @property {import('aptos').HexString} HexString
   * @property {import('aptos').TxnBuilderTypes} TxnBuilderTypes
   */

  getLocalAccount() {
    return this.#localAccount;
  }

  /**
   * @async
   * @returns {Promise<AptosSdk>}
   */
  loadLib() {
    return super.loadLib(APTOS_SDK);
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.#defaultGasPrice = feeData.defaultGasPrice ?? DEFAULT_GAS_PRICE;
    this.#gasPriceCoefficient = feeData.gasPriceCoefficient ?? 1;
    this.#defaultMaxGasPrice = feeData.defaultMaxGasPrice ?? DEFAULT_MAX_GAS_PRICE;
    this.#gasLimit = feeData.gasLimit ?? DEFAULT_GAS_LIMIT;
    this.#gasLimitCoefficient = feeData.gasLimitCoefficient ?? 1;
    this.#txExpirationTimeout = feeData.txExpirationTimeout ?? DEFAULT_EXPIRATION_TIMEOUT;
  }

  /**
   * Returns expiration timestamp
   *
   * @return {bigint}
   */
  getTransactionExpirationTimeout() {
    return BigInt(Math.floor(Date.now() / 1000) + this.#txExpirationTimeout);
  }

  /**
   * Mutates the wallet with the address and keys obtained from AptosAccount
   *
   * @param {AptosAccount} account
   * @returns {void}
   */
  #setAccountAndKeys(account) {
    const { address, publicKeyHex, privateKeyHex } = account.toPrivateKeyObject();

    this.#localAccount.account = account;
    this.address = address;
    this.publicKey = publicKeyHex;
    this.#privateKey = privateKeyHex;
  }

  /**
   * Sets privateKey and restores address from privateKey
   * Mutates the wallet with the address obtained from the private key.
   * Used as a faster method than loadWallet for address recovery.
   *
   * @param {string} privateKey - The private key.
   * @param {string} [mnemonicString]
   * @returns {Promise<void>}
   */
  async setPrivateKey(privateKey, mnemonicString) {
    const { AptosAccount, HexString } = await this.loadLib();
    const account = new AptosAccount(new HexString(privateKey).toUint8Array());

    this.#setAccountAndKeys(account);
  }

  /**
   * Loads a wallet
   * Mutates the wallet with created privateKey and the address obtained from the private key.
   *
   * @param {Buffer} seed - The mnemonic seed.
   * @param {string} [mnemonicString] - The mnemonic string.
   * @returns {Promise<{id: string, privateKey: string, address: string}>}
   */
  async loadWallet(seed, mnemonicString) {
    const { AptosAccount } = await this.loadLib();
    const account = AptosAccount.fromDerivePath(DERIVATION, mnemonicString);

    this.#setAccountAndKeys(account);
    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Validates address
   * Checks for 64 hex characters for a 32-byte account address.
   * @see https://aptos.dev/concepts/basics-accounts/
   *
   * @param {string} address - The address.
   * @returns {Promise<boolean>}
   */
  async validateAddress(address) {
    try {
      const {
        TxnBuilderTypes: { AccountAddress },
      } = await this.loadLib();

      return !!AccountAddress.fromHex(address);
    } catch {
      return false;
    }
  }

  /**
   * Mutates the wallet with the requested balance and returns it
   *
   * @returns {Promise<{balance: string | BN | null}>}
   * @throws {ExternalError}
   */
  async getInfo() {
    try {
      const { balance, isRegistered } = (await this.getProvider('balance').getInfo(this.address)) ?? {};

      if (isRegistered) {
        this.#localAccount.isRegistered = true;
        this.balance = balance;
      }
      return { balance };
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Gets the estimated gas price
   *
   * @returns {Promise<number>}
   */
  async getGasPrice() {
    const { gas_estimate: gasPrice } = await this.getProvider('node').getGasPrice();

    return parseInt(gasPrice, 10);
  }

  /**
   * @typedef UserFeeOptions
   * @type {object}
   * @property {string | null} [userGasPrice=null] - Custom gas price.
   * @property {string | null} [gasLimit=null] - Custom gas limit.
   */

  /**
   * Gets gas params
   * @param {UserFeeOptions} userOptions
   * @returns {Promise<{gasPrice: number, gasLimit: number}>}
   */
  async getGasParams({ userGasPrice = null, gasLimit: userGasLimit = null } = {}) {
    const rawGasPrice = userGasPrice
      ? Number(userGasPrice)
      : (null ?? ((await this.getGasPrice()) ?? this.#defaultGasPrice) * this.#gasPriceCoefficient);
    const gasPrice = rawGasPrice < this.#defaultMaxGasPrice ? rawGasPrice : this.#defaultMaxGasPrice;

    const gasLimit = userGasLimit ? Number(userGasLimit) : (null ?? this.#gasLimit * this.#gasLimitCoefficient);

    return { gasPrice, gasLimit };
  }

  /**
   * Gets the estimated fee for the transaction
   *
   * @param {UserFeeOptions} [userOptions] - Custom priority
   * @returns {Promise<string>}
   * @throws {ExternalError}
   */
  async getFee(userOptions) {
    try {
      const { gasPrice, gasLimit } = await this.getGasParams(userOptions);

      return String(gasPrice * gasLimit);
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  getAccount(address = this.address) {
    return this.getProvider('node').getAccount(address);
  }

  /**
   * Creates a transaction to transfer funds
   *
   * @param {string} address - To address.
   * @param {string} amount - Amount of funds.
   * @param {string | null} [userGasPrice=null] - Custom gas price.
   * @param {string | null} [gasLimit=null] - Custom gas limit.
   * @returns {Promise<Uint8Array>} - Signed transaction
   * @throws {ExternalError}
   */
  async createTransaction({ address, amount, userGasPrice, gasLimit: userGasLimit }) {
    const {
      AptosClient,
      BCS,
      TxnBuilderTypes: { AccountAddress, ChainId, EntryFunction, RawTransaction, TransactionPayloadEntryFunction },
    } = await this.loadLib();

    const entryFunctionPayload = new TransactionPayloadEntryFunction(
      EntryFunction.natural(
        APTOS_TRANSFER_MODULE_NAME,
        APTOS_TRANSFER_FUNCTION_NAME,
        [],
        [BCS.bcsToBytes(AccountAddress.fromHex(address)), BCS.bcsSerializeUint64(BigInt(amount))],
      ),
    );

    try {
      const [{ sequence_number: sequenceNumber }, { gasPrice, gasLimit }] = await Promise.all([
        this.getAccount(),
        this.getGasParams({ userGasPrice, gasLimit: userGasLimit }),
      ]);

      const rawTxn = new RawTransaction(
        AccountAddress.fromHex(this.address),
        BigInt(sequenceNumber),
        entryFunctionPayload,
        // Max gas unit to spend
        BigInt(gasLimit),
        // Gas price per unit
        BigInt(gasPrice),
        // Expiration timestamp. Transaction is discarded if it is not executed within
        // provided `txExpirationTimeout` seconds from now.
        this.getTransactionExpirationTimeout(),
        new ChainId(APTOS_MAINNET_CHAIN_ID),
      );

      return AptosClient.generateBCSTransaction(this.#localAccount.account, rawTxn);
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Sends the transaction
   *
   * @async
   * @param {Uint8Array} bcsTxn - Raw transaction
   * @returns {Promise<{txid: string}>} - The transaction id.
   * @throws {ExternalError}
   */
  sendTransaction(bcsTxn) {
    return this.getProvider('send').sendTransaction(bcsTxn);
  }
}

export default APTCoin;
