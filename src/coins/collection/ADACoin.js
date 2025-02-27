import Coin from 'src/abstract/coin';
import { DEFAULT_ADALITE_SUBMIT_URL, IS_IOS } from 'src/env';
import { WalletError } from 'src/errors';
import { AdaAtomicExplorer, YoroExplorer } from 'src/explorers/collection';
import { LazyLoadedLib, logger, preventConcurrent } from 'src/utils';
import { LOAD_WALLET_ERROR, SEND_TRANSACTION_TYPE } from 'src/utils';

import { HasProviders } from '../mixins';

const NAME = 'Cardano';
const TICKER = 'ADA';
const DECIMAL = 6;
const DERIVATION = "m/44'/1815'/0'/0/0";
const UNSPENDABLE_BALANCE = '0';
const DUST_AMOUNT = '1000000';
const ADA_LIB_API = 'AdaLibApi';
const POOL_ADDRESS_LENGTH = 56;
const POOL_ADDRESS_REGEXP = /(pool[0-9a-zA-Z]{2,50}|[0-9a-fA-F]{6,})/;

/**
 * Description placeholder
 * @date 6/20/2023 - 4:41:59 PM
 *
 * @class ADACoin
 * @typedef {ADACoin}
 * @extends {HasProviders(Coin)}
 */
class ADACoin extends HasProviders(Coin) {
  #privateKey;
  #legacyAccount;
  #cip1852Account;

  /** @type {import('./libs/AdaLibApi').default|null} */
  coreLibrary = null;

  /** @type {object|null} */
  cardanoWalletV2 = null;
  /** @type {object|null} */
  cardanoWalletV4 = null;

  constructor({ alias, notify, feeData, explorers, txWebUrl, submitUrl, socket, id }, db, configManager) {
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
      submitUrl: submitUrl || DEFAULT_ADALITE_SUBMIT_URL,
      dustAmount: DUST_AMOUNT,
      dependencies: {
        [ADA_LIB_API]: new LazyLoadedLib(() => import('../libs/AdaLibApi')),
      },
    };

    super(config, db, configManager);

    this.derivation = DERIVATION;

    this.setExplorersModules([AdaAtomicExplorer, YoroExplorer]);

    this.loadExplorers(config);

    this.#privateKey = {};
    this.feePerByte = feeData.feePerByte;
    this.constantPart = feeData.constantPart;

    this.feeParams = {
      feeCoefficient: this.feePerByte || '44',
      feeConst: this.constantPart || '2800000',
    };
    this.dustAmount = DUST_AMOUNT;
  }

  loadLibsPromise = preventConcurrent(this.loadLibs.bind(this));

  /**
   * Gets core lib instance
   * @returns {Promise<import('./libs/AdaLibApi').default>}
   */
  async getCoreLibrary() {
    if (this.coreLibrary) {
      return this.coreLibrary;
    }

    const [{ default: AdaLibApi }] = await Promise.all([this.loadLib(ADA_LIB_API), this.loadLibsPromise()]);

    this.coreLibrary = new AdaLibApi(this.cardanoWalletV2, this.cardanoWalletV4, this.feeParams);

    return this.coreLibrary;
  }

  async loadLibs() {
    if (this.cardanoWalletV2 && this.cardanoWalletV4) {
      return [this.cardanoWalletV2, this.cardanoWalletV4];
    }

    const isIOS = IS_IOS;
    const isNode = typeof process !== 'undefined' && !!process.versions?.node;

    let modules;

    if (isNode) {
      modules = await Promise.all([import('cardano-wallet'), import('@emurgo/cardano-serialization-lib-nodejs')]);
    } else {
      modules = await Promise.all(
        isIOS
          ? [import('cardano-wallet-asm'), import('@emurgo/cardano-serialization-lib-asmjs')]
          : [import('cardano-wallet-browser'), import('@emurgo/cardano-serialization-lib-browser')],
      );
    }

    this.cardanoWalletV2 = modules[0];
    this.cardanoWalletV4 = modules[1];

    return modules;
  }

  validateStakePoolAddress(poolAddress) {
    return poolAddress.length === POOL_ADDRESS_LENGTH && POOL_ADDRESS_REGEXP.test(poolAddress);
  }

  async setPrivateKey(privateKey, mnemonic = undefined) {
    let key = privateKey;

    if (privateKey?.shelleyKey) {
      key = privateKey.shelleyKey;
    }

    const coreLibrary = await this.getCoreLibrary();
    const validShelleyPrivateKey = coreLibrary.validateShelleyPrivateKey(key);

    if (validShelleyPrivateKey) {
      this.#privateKey.shelleyKey = key;
      this.#privateKey.byronKey = privateKey.byronKey;
      this.#privateKey.byronAddress = privateKey.byronAddress;
      this.#cip1852Account = coreLibrary.getCip1852AccountFromPrivateKey(key);
      this.#legacyAccount = coreLibrary.getLegacyAccountFromMnemonic(mnemonic);
    } else {
      this.#privateKey.byronKey = key;

      throw new Error('Legacy Byron Private key appears');
    }
  }

  async setAddress(address) {
    const coreLibrary = await this.getCoreLibrary();
    const validShelleyAddress = coreLibrary.validateShelleyAddress(address);

    if (!validShelleyAddress) {
      this.#privateKey.byronAddress = address;
    } else {
      this.address = address;
    }
  }

  getAddress() {
    return this.#privateKey.shelleyKey
      ? this.address
      : new WalletError({
          type: LOAD_WALLET_ERROR,
          error: new Error('Could not get address, pkey is not exists'),
          instance: this,
        });
  }

  async loadWallet(seed, mnemonic) {
    try {
      const coreLibrary = await this.getCoreLibrary();

      this.#privateKey.shelleyKey = await coreLibrary.getPrivateKeyByMnemonic(mnemonic);
      this.#privateKey.byronKey = await coreLibrary.getLegacyPrivateKeyByMnemonic(mnemonic);
      this.#legacyAccount = coreLibrary.getLegacyAccountFromMnemonic(mnemonic);
      this.#privateKey.byronAddress = await coreLibrary.getLegacyAddressByPrivateKeySync(this.#privateKey.byronKey);

      this.address = await coreLibrary.getAddressByPrivateKey();
    } catch (error) {
      logger.log({ instance: this, error });
      console.error('ADA load walled failed, core library is not initialized');
    }

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  getLatestBlock() {
    return this.getProvider('block').getLatestBlock();
  }

  async validateAddress(address) {
    const coreLibrary = await this.getCoreLibrary();

    return coreLibrary.validateAddress(address);
  }

  async isDustAmount(amount, availableBalance) {
    const available = availableBalance || (await this.availableBalance());

    const dust = new this.BN(this.dustAmount);
    const balance = new this.BN(this.toMinimalUnit(available));

    const send = new this.BN(this.toMinimalUnit(amount));

    const change = balance.sub(send);

    if (send.lt(dust)) {
      return 'Minimal amount to send is 1 ADA';
    }

    if (change.gt(new this.BN('0')) && change.lt(dust)) {
      return 'Minimal change is 1 ADA, try to send another amount';
    }

    return false;
  }

  async createTransaction({ address, amount, changeAddress = this.address }) {
    if (typeof address !== 'string') {
      throw new TypeError('ADA: createTransaction: address must be string');
    }
    if (typeof amount !== 'string') {
      throw new TypeError('ADA: createTransaction: amount must be string');
    }

    if (!this.#privateKey.shelleyKey) {
      throw new WalletError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error('privateKey must be loaded'),
        instance: this,
      });
    }

    const [lastblock, utxo, coreLibrary] = await Promise.all([
      this.getLatestBlock(),
      this.getUnspentOutputs(changeAddress),
      this.getCoreLibrary(),
    ]);

    try {
      return coreLibrary.createTransaction({
        address,
        amount,
        changeAddress,
        utxo,
        slotNo: lastblock.slot_no,
        legacyAccount: this.#legacyAccount,
        cip: this.#cip1852Account,
      });
    } catch (error) {
      console.log(error);
      throw new WalletError({
        type: SEND_TRANSACTION_TYPE,
        error,
        instance: this,
      });
    }
  }

  async createClaimTransaction(legacyUtxo = undefined) {
    const utxo = legacyUtxo || (await this.getLegacyAddressUnspentOutputs());

    if (!utxo || utxo.length === 0) {
      throw new Error('Nothing to claim');
    }

    const [lastblock, amount, coreLibrary] = await Promise.all([
      this.getLatestBlock(),
      this.getLegacyAddressAvailableBalance({
        address: this.address,
        legacyUtxo: utxo,
      }),
      this.getCoreLibrary(),
    ]);

    return coreLibrary.createTransaction({
      address: this.address,
      amount,
      changeAddress: this.#privateKey.byronAddress,
      utxo,
      slotNo: lastblock.slot_no,
    });
  }

  getLegacyAddressUnspentOutputs() {
    const { byronAddress } = this.#privateKey;

    return this.getUnspentOutputs(byronAddress);
  }

  async getLegacyAddressAvailableBalance({ legacyUtxo, address }) {
    const { byronAddress } = this.#privateKey;
    const utxos = legacyUtxo || (await this.getUnspentOutputs(byronAddress));

    const balance = utxos.reduce((acc, out) => {
      return acc.add(new this.BN(out.amount));
    }, new this.BN('0'));

    if (Number(balance) === 0) {
      return balance;
    }

    const fee = await this.getFee({
      amount: balance,
      address,
      utxos,
      changeAddress: byronAddress,
    });

    const available = balance.sub(fee);

    if (available.lt(new this.BN(this.dustAmount))) {
      return new this.BN('0');
    }

    return available.toString();
  }

  getUnspentOutputs(address = this.address) {
    return this.getProvider('utxo').getUnspentOutputs(address);
  }

  async getFee({ amount = null, address, utxos, changeAddress } = {}) {
    const addressToSend = address && address.length > 0 ? address : this.address;

    const [outputs, lastblock, coreLibrary] = await Promise.all([
      utxos || (await this.getUnspentOutputs(changeAddress || this.address)),
      this.getLatestBlock(),
      this.getCoreLibrary(),
    ]);

    let amountToSend = Number(amount);

    if (!amountToSend) {
      amountToSend = Number(this.balance) ? this.balance : '1';
    }

    const fee = coreLibrary.estimateFee({
      address: addressToSend,
      amount: this.toMinimalUnit(amountToSend),
      outputs,
      ttl: lastblock.slot_no,
    });

    return new this.BN(fee);
  }

  async getInfo() {
    const [balance, coreLibrary] = await Promise.all([this.getBalance(), this.getCoreLibrary()]);

    const stakeAddress = coreLibrary.getRewardAddress(this.address).to_address().to_bech32();
    const accountState = await this.getProvider('balance').getAccountState(stakeAddress);

    this.balance = balance;
    this.balances = {
      available: this.toCurrencyUnit(balance),
      rewards: accountState && accountState.reward,
      staking: {
        total: accountState && accountState.poolId ? this.balance : '0',
        validator: accountState && accountState.poolId,
      },
    };

    return {
      balance: this.balance,
      balances: this.balances,
    };
  }

  async createDelegationTransaction(poolId, stakeAddressRegistered) {
    if (!this.#privateKey.shelleyKey) {
      throw new WalletError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error('privateKey must be loaded'),
        instance: this,
      });
    }

    const [lastblock, utxo, coreLibrary] = await Promise.all([
      this.getLatestBlock(),
      this.getUnspentOutputs(this.address),
      this.getCoreLibrary(),
    ]);

    return coreLibrary.createDelegationTransaction({
      utxo,
      slotNo: lastblock.slot_no,
      paymentAddress: this.address,
      poolId,
      stakeAddressRegistered,
    });
  }

  async stake(poolId) {
    const coreLibrary = await this.getCoreLibrary();
    const stakeAddressHex = coreLibrary.getRewardAddressHexFromAddressStr(this.address);
    const { [stakeAddressHex]: regHistory } =
      await this.getProvider('regHistory').getRegistrationHistory(stakeAddressHex);

    const registered = regHistory && regHistory[0] && regHistory[0].certType === 'StakeRegistration';

    const delegationTx = await this.createDelegationTransaction(poolId, registered);

    return this.sendTransactionOnce(delegationTx);
  }

  async claim() {
    const [lastblock, utxo, coreLibrary] = await Promise.all([
      this.getLatestBlock(),
      this.getUnspentOutputs(this.address),
      this.getCoreLibrary(),
    ]);

    const rewardAddress = coreLibrary.getRewardAddress(this.address);
    const bech32RewardAddress = rewardAddress.to_address().to_bech32();
    const accountState = await this.getProvider('balance').getAccountState(bech32RewardAddress);

    const tx = await coreLibrary.createWithdrawalTransaction({
      paymentAddress: this.address,
      utxo,
      slotNo: lastblock.slot_no,
      rewardAddress,
      amountToWithdraw: accountState.reward,
    });

    return this.sendTransactionOnce(tx);
  }

  getDelegatedPoolKey() {
    const cert = this.getProvider('history').lastDelegationCert;

    if (cert) {
      return cert.poolKeyHash;
    }

    return '';
  }
}

export default ADACoin;
