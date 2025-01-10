import axios from 'axios';
import { Coin } from 'src/abstract';
import { ExplorerRequestError, WalletError } from 'src/errors';
import TzktIoV1Explorer from 'src/explorers/collection/TzktIoV1Explorer';
import TezosNodeWithBlockscannerExplorer from 'src/explorers/extended/TezosNodeWithBlockscannerExplorer';
import { LazyLoadedLib } from 'src/utils';
import { LOAD_WALLET_ERROR, SEND_TRANSACTION_TYPE } from 'src/utils/const';

// import configManager from '../ConfigManager';
// import { coinStakings } from '../Stakings';
// import logger from '../Logger';

// import predefinedValidators from 'src/resources/staking/validators.json';
// import validators from 'src/resources/staking/validators.json';
import { HasProviders } from '../mixins';

const bs58checkLazyLoaded = new LazyLoadedLib(() => import('bs58check'));
const libsodiumWrappersLazyLoaded = new LazyLoadedLib(() => import('libsodium-wrappers'));

const NAME = 'Tezos';
const TICKER = 'XTZ';
const DERIVATION = "m/44'/1729'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '275000';
const PK_HASH_LENGTH = 32;
const HASH_LENGTH = 20;

/**
 * Class
 *
 * @class XTZCoin
 */
class XTZCoin extends HasProviders(Coin) {
  #privateKey;
  libsodiumWrappers;

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
      explorers,
      txWebUrl,
      socket,
      feeData,
    };

    // TODO remove when StakingMixin will be used!
    // configManager.register('stake_validators_tezos');

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([TzktIoV1Explorer, TezosNodeWithBlockscannerExplorer]);

    this.loadExplorers(config);

    this.network = '';

    this.prefix = {
      tz1: new Uint8Array([6, 161, 159]),
      edpk: new Uint8Array([13, 15, 37, 217]),
      edsk: new Uint8Array([43, 246, 78, 7]),
      edsig: new Uint8Array([9, 245, 205, 134, 18]),
    };

    this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
      this.getInfo();

      if (unconfirmedTx && unconfirmedTx.direction) {
        this.eventEmitter.emit('socket::newtx', {
          id: this.id,
          ticker,
          amount: unconfirmedTx.amount,
          txid: unconfirmedTx.txid,
        });
      } else {
        this.eventEmitter.emit('socket::newtx::outgoing', {
          id: this.id,
          ticker,
        });
      }
    });
  }

  async getLibsodiumWrappers() {
    if (!this.libsodiumWrappers) {
      const { default: libsodiumWrappers } = await libsodiumWrappersLazyLoaded.get();

      await libsodiumWrappers.ready;
      this.libsodiumWrappers = libsodiumWrappers;
    }
    return this.libsodiumWrappers;
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed) {
    const libsodiumWrappers = await this.getLibsodiumWrappers();
    const keyPair = libsodiumWrappers.crypto_sign_seed_keypair(seed.slice(0, PK_HASH_LENGTH));

    if (!keyPair) {
      throw new Error(`${this.ticker} can't get a privateKey`);
    }

    const [privateKey, address] = await Promise.all([
      this.bs58EncodeWithPrefix(keyPair.privateKey, this.prefix.edsk),
      this.bs58EncodeWithPrefix(libsodiumWrappers.crypto_generichash(HASH_LENGTH, keyPair.publicKey), this.prefix.tz1),
    ]);

    this.#privateKey = privateKey;
    this.address = address;

    return { id: this.id, privateKey, address };
  }

  /**
   * The address getter
   *
   * @return {Promise<string>}
   */
  async getAddress() {
    if (this.#privateKey) {
      const libsodiumWrappers = await this.getLibsodiumWrappers();

      return this.bs58EncodeWithPrefix(
        libsodiumWrappers.crypto_generichash(
          HASH_LENGTH,
          await this.bs58Decode(this.#privateKey, this.prefix.edsk).slice(PK_HASH_LENGTH),
        ),
        this.prefix.tz1,
      );
    }
    return new WalletError({
      type: LOAD_WALLET_ERROR,
      error: new Error('privateKey is empty!'),
      instance: this,
    });
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    if (!address) {
      return false;
    }
    try {
      await this.bs58Decode(address, this.prefix.tz1);
      return true;
    } catch (error) {
      return false;
    }
  }

  async create(operation) {
    if (!this.#privateKey) {
      throw new Error('[XTZ] forge() error: no privateKey');
    }

    const [fee, publicKey] = await Promise.all([
      this.getFee(),
      this.bs58EncodeWithPrefix(
        (await this.bs58Decode(this.#privateKey, this.prefix.edsk)).slice(PK_HASH_LENGTH),
        this.prefix.edpk,
      ),
    ]);

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const nodeUrl = this.getProvider('send').config.baseUrl;

    const [headerInfo, counter, managerKey] = await Promise.all([
      axios.get(`${nodeUrl}/chains/main/blocks/head/header`).then((res) => res.data),
      axios.get(`${nodeUrl}/chains/main/blocks/head/context/contracts/${this.address}/counter`).then((res) => res.data),
      axios
        .get(`${nodeUrl}/chains/main/blocks/head/context/contracts/${this.address}/manager_key`)
        .then((res) => res.data),
    ]);

    const operations = [];
    let newCounter = Number(counter);

    if (!managerKey) {
      newCounter += 1;

      operations.push({
        kind: 'reveal',
        fee: fee.toString(),
        gas_limit: this.feeData.gasLimit,
        storage_limit: this.feeData.storageLimit,
        public_key: publicKey,
        source: this.address,
        counter: String(newCounter),
      });
    }

    newCounter += 1;

    operation.counter = String(newCounter);
    operations.push(
      Object.assign(operation, {
        fee: fee.toString(),
        source: this.address,
        counter: String(newCounter),
        gas_limit: this.feeData.gasLimit,
        storage_limit: this.feeData.storageLimit,
      }),
    );

    const operationsObject = {
      branch: headerInfo.hash,
      contents: operations,
    };
    const protocol = headerInfo.protocol;

    // genearate transaction
    const resultRawTx = await axios.post(
      `${nodeUrl}/chains/${headerInfo.chain_id}/blocks/${headerInfo.hash}/helpers/forge/operations`,
      operationsObject,
      config,
    );

    const rawTx = resultRawTx.data;

    operationsObject.protocol = protocol;

    // sign
    const signed = await this.sign(rawTx);
    const signedRawTransaction = signed.sbytes;

    operationsObject.signature = signed.edsig;

    // check transaction
    const operationObjectResults = await axios.post(
      `${nodeUrl}/chains/main/blocks/head/helpers/preapply/operations`,
      [operationsObject],
      config,
    );

    // check result
    if (!Array.isArray(operationObjectResults.data)) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new TypeError(`${this.ticker} node fail check transaction!`),
        instance: this,
      });
    }

    const errors = operationObjectResults.data.reduce((acc, operationObjectResult, index) => {
      acc.push(
        ...operationObjectResult.contents.reduce((opAcc, { destination, metadata }) => {
          if (operation.kind === 'transaction' && destination && destination !== operation.destination) {
            opAcc.push('operation is malicious, destination changed');
          }
          if (typeof metadata.operation_result !== 'undefined' && metadata.operation_result.status === 'failed') {
            // operations failed
            opAcc.push(...metadata.operation_result.errors);
          }
          return opAcc;
        }, []),
      );
      return acc;
    }, []);

    if (errors.length > 0) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: errors.join(),
        instance: this,
      });
    }

    return signedRawTransaction;
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({ address, amount }) {
    return this.create({
      kind: 'transaction',
      amount: amount.toString(),
      destination: address,
    });
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @return {Promise<String>} Raw transaction
   */
  async createDelegationTransaction(address) {
    return this.create({
      kind: 'delegation',
      delegate: address,
    });
  }

  async sendTransaction(rawTx) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const nodeUrl = this.getProvider('send').config.baseUrl;

    try {
      const response = await axios.post(`${nodeUrl}/injection/operation`, JSON.stringify(rawTx), config);

      return {
        txid: response.data,
      };
    } catch (error) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error,
        instance: this,
      });
    }
  }

  async sign(rawTx) {
    const waterMarkValue = 3;
    const watermark = new Uint8Array([waterMarkValue]); // https://gitlab.com/tezos/tezos/issues/199

    let byteBuffer = this.hex2buf(rawTx);

    byteBuffer = this.mergebuf(watermark, byteBuffer);

    const libsodiumWrappers = await this.getLibsodiumWrappers();
    const sig = libsodiumWrappers.crypto_sign_detached(
      libsodiumWrappers.crypto_generichash(PK_HASH_LENGTH, byteBuffer),
      await this.bs58Decode(this.#privateKey, this.prefix.edsk),
      'uint8array',
    );
    const edsig = await this.bs58EncodeWithPrefix(sig, this.prefix.edsig);
    const signedBytes = rawTx + this.buf2hex(sig);

    return {
      bytes: rawTx,
      sig,
      edsig,
      sbytes: signedBytes,
    };
  }

  async bs58EncodeWithPrefix(payload, prefix) {
    const newString = new Uint8Array(prefix.length + payload.length);

    newString.set(prefix);
    newString.set(payload, prefix.length);

    const { default: bs58check } = await bs58checkLazyLoaded.get();

    return bs58check.encode(Buffer.from(newString, 'hex'));
  }

  async bs58Decode(enc, prefix) {
    const { default: bs58check } = await bs58checkLazyLoaded.get();

    return bs58check.decode(enc).slice(prefix.length);
  }

  buf2hex(buffer) {
    const byteArray = new Uint8Array(buffer);
    const hexParts = [];

    for (let index = 0; index < byteArray.length; index += 1) {
      const twoByte = 16;
      const twoSymbol = -2;
      const hex = byteArray[index].toString(twoByte);
      const paddedHex = `00${hex}`.slice(twoSymbol);

      hexParts.push(paddedHex);
    }

    return hexParts.join('');
  }

  hex2buf(hex) {
    return new Uint8Array(hex.match(/[\da-f]{2}/gi).map((char) => parseInt(char, 16)));
  }

  mergebuf(b1, b2) {
    const buf = new Uint8Array(b1.length + b2.length);

    buf.set(b1);
    buf.set(b2, b1.length);

    return buf;
  }

  /**
   * Gets the balance.
   *
   * @return {Promise<BN>} The balance.
   */
  async getInfo() {
    await this.getBalance();

    return {
      balance: this.balance,
      balances: this.balances,
      transactions: [],
    };
  }

  async getBalance() {
    this.balance = this.toMinimalUnit(await this.getProvider('balance').getBalance(this.address));

    const delegate = await this.getProvider('balance')
      .getDelegate(this.address)
      .catch((error) => console.error(error)); // eslint-disable-line no-console

    this.balances = {
      available: this.toCurrencyUnit(this.balance),
      staking: {
        total: delegate ? this.toCurrencyUnit(this.balance) : '0',
        validator: delegate || '',
      },
    };
  }

  getTransactions({ pageNum = 0 } = {}) {
    return this.getProvider('history').getTransactions({
      address: this.address,
      pageNum,
    });
  }

  getTransaction(txid) {
    return this.getProvider('history').getTransaction(this.address, txid);
  }

  /**
   * @deprecated
   *
   * Should be migrated to `StakingMixin`
   * @return {Promise<void>}
   */
  // async getPredefinedValidators() {
  //   const coinStaking = coinStakings.find(
  //     (item) => item.getName().toLowerCase() === this.ticker.toLowerCase(),
  //   );
  //
  //   if (!coinStaking || coinStaking.validators?.length > 0) {
  //     return;
  //   }
  //
  //   // configManager.register('stake_validators_tezos');
  //   // const validators = await configManager
  //   //   .get('stake_validators_tezos')
  //   //   .catch((error) => {
  //   //     // logger.error(error);
  //   //     return predefinedValidators.find(
  //   //       (item) => item.currency === this.ticker,
  //   //     );
  //   //   });
  //
  //   const predefinedValidatros = validators.find(({ currency }) => currency === 'XTZ') ?? {}
  //
  //   coinStaking.modifyPredefinedValidators(
  //     predefinedValidatros.filter(
  //       (validator) => validator.stakingCapacity > validator.stakingBalance,
  //     ),
  //   );
  // }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}

export default XTZCoin;
