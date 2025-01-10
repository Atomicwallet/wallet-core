import { bytes, Long, units } from '@zilliqa-js/util';
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { Coin } from 'src/abstract';
import { WalletError } from 'src/errors';
import ViewblockExplorer from 'src/explorers/collection//ViewblockExplorer';
import ZilliqaAtomicExplorer from 'src/explorers/collection//ZilliqaAtomicExplorer';
import ZilliqaNodeExplorer from 'src/explorers/collection//ZilliqaNodeExplorer';
import { ZILToken } from 'src/tokens';
import { LazyLoadedLib } from 'src/utils';
import { LOAD_WALLET_ERROR, WALLET_ERROR } from 'src/utils/const';

import { HasBlockScanner, HasProviders, HasTokensMixin } from '../mixins';

const bitcoinJsLib = new LazyLoadedLib(() => import('bitcoinjs-lib'));
const zilliqaCryptoLib = new LazyLoadedLib(() => import('@zilliqa-js/crypto'));
const bs58checkLib = new LazyLoadedLib(() => import('bs58check'));

const NAME = 'Zilliqa';
const TICKER = 'ZIL';
const DERIVATION = "m/44'/313'/0'/0/0";
const DECIMAL = 12;
const UNSPENDABLE_BALANCE = '0';

const CONTRACT_GAS_LIMIT = 25000;
const SEND_GAS_LIMIT = 100;
const TOKEN_GAS_LIMIT = 1000;
const MSG_VERSION = 1;
const CHAIN_ID = 1; // 1 - mainnet, 333 - testnet
const TX_VERSION_MAINNET = bytes.pack(CHAIN_ID, MSG_VERSION);
const DEFAULT_RESERVE_FOR_STAKE = '8400000000000';

const GZIL = {
  name: 'Governance ZIL',
  ticker: 'gZIL',
  decimal: 15,
  contract: 'zil14pzuzq6v6pmmmrfjhczywguu0e97djepxt8g3e',
};

class ZILCoin extends HasBlockScanner(HasProviders(HasTokensMixin(Coin))) {
  #privateKey;

  /**
   * Constructs the object.
   *
   * @param {String} alias the alias
   * @param {String} fee the fee data
   * @param {Explorer[]}  explorers the explorers
   * @param {String} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, stakingContract, stakingProxyContract, id }) {
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
      stakingContract,
      feeData,
      stakingProxyContract,
    };

    // TODO remove when StakingMixin will be used!
    // configManager.register('stake_validators_zil');

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([ZilliqaAtomicExplorer, ViewblockExplorer, ZilliqaNodeExplorer]);

    this.loadExplorers(config);

    this.setFeeData(feeData);

    this.zilliqa = new Zilliqa();
    this.balances = {};
    this.transactions = [];
    this.tokens = {};
    this.nonce = 0;
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.fee = feeData.fee;
    this.stakingProxyContract = feeData.stakingProxyContract;
    this.stakingContract = feeData.stakingContract;
    this.stakingFeeGas = String(feeData.stakingFeeGas) || CONTRACT_GAS_LIMIT;
    this.unstakingFeeGas = String(feeData.unstakingFeeGas) || CONTRACT_GAS_LIMIT;
    this.claimFeeGas = String(feeData.claimFeeGas) || CONTRACT_GAS_LIMIT;
    this.tokenFeeGas = String(feeData.tokenFeeGas) || TOKEN_GAS_LIMIT;
    this.sendFeeGas = String(feeData.sendFeeGas) || SEND_GAS_LIMIT;
    this.gasLimit = String(feeData.gasLimit);
    this.gasSettings = feeData.gasSettings;
    this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_FOR_STAKE;
  }

  async loadWallet(seed, phrase) {
    const hdPrivateKey = (await bitcoinJsLib.get()).bip32.fromSeed(seed);
    const key = hdPrivateKey.derivePath(this.derivation);
    const bs58check = await bs58checkLib.get();

    if (!key) {
      throw new WalletError({
        type: LOAD_WALLET_ERROR,
        error: new Error("can't get a privateKey!"),
        instance: this,
      });
    }

    const privateKey = bs58check.decode(key.toWIF()).toString('hex');
    const privateKeyLength = 64;
    const prefixLength = 2;

    this.#privateKey = privateKey.slice(prefixLength, prefixLength + privateKeyLength);

    this.zilliqa.wallet.addByPrivateKey(this.#privateKey);

    const { toBech32Address, getAddressFromPrivateKey } = await zilliqaCryptoLib.get();

    this.address = toBech32Address(getAddressFromPrivateKey(this.#privateKey));
    this.oldFormatAddressForBalance = getAddressFromPrivateKey(this.#privateKey).replace(/^0x/, '');

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  getNonce() {
    const nonce = Number(this.nonce) + 1;

    this.nonce = nonce;

    return nonce;
  }

  async getFee({
    sendType = 'send',
    userGasPrice = this.getGasPrice(sendType.toLowerCase()),
    gasLimit = this.getGasLimit(sendType.toLowerCase()),
    isToken,
  } = {}) {
    if (isToken) {
      gasLimit = this.tokenFeeGas;
    }

    return new this.BN(userGasPrice).mul(new this.BN(gasLimit || SEND_GAS_LIMIT));
  }

  /**
   * The address getter
   *
   * @return {String|WalletError}
   */
  async getAddress() {
    if (this.#privateKey) {
      const { toBech32Address, getAddressFromPrivateKey } = await zilliqaCryptoLib.get();

      return toBech32Address(getAddressFromPrivateKey(this.#privateKey));
    }

    return new WalletError({
      type: WALLET_ERROR,
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
    try {
      const { isValidChecksumAddress, fromBech32Address } = await zilliqaCryptoLib.get();

      return isValidChecksumAddress(fromBech32Address(address));
    } catch (error) {
      return false;
    }
  }

  async toValidChecksumAddress(address) {
    let checksumAddr = '';

    const { toChecksumAddress, fromBech32Address } = await zilliqaCryptoLib.get();

    try {
      checksumAddr = toChecksumAddress(address);
    } catch (error) {
      checksumAddr = toChecksumAddress(fromBech32Address(address));
    }

    return checksumAddr.toLowerCase();
  }

  async createTransaction({ address, amount, sendType = 'send' }) {
    await this.getInfo();

    return {
      version: TX_VERSION_MAINNET,
      toAddr: address,
      amount: new this.BN(amount),
      gasPrice: new this.BN(this.getGasPrice(sendType.toLowerCase())),
      gasLimit: Long.fromString(this.getGasLimit(sendType.toLowerCase())),
      nonce: this.getNonce(),
      pubKey: this.zilliqa.wallet.defaultAccount.publicKey,
    };
  }

  async sendTransaction(rawtx) {
    return this.getProvider('send').sendTransaction({
      rawtx,
      privateKey: this.#privateKey,
    });
  }

  async getInfo() {
    const { balance, nonce } = await this.getProvider('balance').getBalance(this.address, this.stakingContract);

    try {
      const { staking, withdrawals } = await this.getProvider('staking').getStakingBalance(
        this.address,
        this.stakingContract,
      );

      this.balances.staking = staking;
      this.balances.withdrawals = withdrawals;

      const reward = await this.getProvider('rewards').getRewards(this.address, this.stakingContract, staking);

      this.balances.rewards = reward;

      const balanceBN = new this.BN(balance || 0);

      const total = new this.BN(balanceBN)
        .add(new this.BN(staking.total))
        .add(new this.BN(withdrawals.total))
        .add(new this.BN(reward.total))
        .toString();
      const available = units.fromQa(balanceBN, 'zil');

      const gasLimit = this.getGasLimit('stake');
      const fee = await this.getFee({ gasLimit: gasLimit || 1 });
      const availableForStake = new this.BN(balanceBN).sub(new this.BN(fee)).sub(new this.BN(this.reserveForStake));

      this.balance = total;
      this.balances.available = available;
      this.balances.availableForStake = Number(availableForStake) > 0 ? units.fromQa(availableForStake, 'zil') : '0';
      this.balances.total = total;
    } catch (error) {
      this.balance = balance;
      console.error(error);
    }

    const contracts = Object.keys(this.tokens || {}).filter(Boolean);

    if (contracts.length > 0) {
      const tokensBalance = (await this.getProvider('token').getTokenBalance(this.address, contracts)) || [];

      tokensBalance.forEach((tokenBalance) => {
        this.tokens[tokenBalance.contract].balance = tokenBalance.balance;
      });
    }

    if (nonce) {
      this.nonce = Number(nonce) > Number(this.nonce) ? Number(nonce) : this.nonce;
    }

    return {
      balance,
      balances: this.balances,
    };
  }

  async setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
    this.zilliqa.wallet.addByPrivateKey(this.#privateKey);

    const { getAddressFromPrivateKey } = await zilliqaCryptoLib.get();

    this.oldFormatAddressForBalance = getAddressFromPrivateKey(this.#privateKey).replace(/^0x/, '');
  }

  changeProviders(explorers) {
    const balanceProviderClass = explorers.find((explorer) => explorer.balanceProvider === true);

    this.balanceProvider =
      balanceProviderClass && balanceProviderClass.className === 'ViewblockExplorer' ? this.explorer : this.node;
  }

  updateCoinParamsFromServer(data) {
    super.updateCoinParamsFromServer(data);
    this.changeProviders(data.explorers);
  }

  async createDelegationTransaction({ validator = '', amount = 0 }) {
    await this.getInfo();

    const { fromBech32Address } = await zilliqaCryptoLib.get();

    return {
      version: TX_VERSION_MAINNET,
      toAddr: fromBech32Address(this.stakingProxyContract),
      amount: new this.BN(amount),
      gasPrice: new this.BN(this.fee),
      gasLimit: Long.fromNumber(this.stakingFeeGas),
      nonce: this.getNonce(),
      pubKey: this.zilliqa.wallet.defaultAccount.publicKey,
      data: JSON.stringify({
        _tag: 'DelegateStake',
        params: [
          {
            vname: 'ssnaddr',
            type: 'ByStr20',
            value: await this.toValidChecksumAddress(validator),
          },
        ],
      }),
    };
  }

  async createUnDelegationTransaction({
    validator = '',
    amount = 0,
    gasPrice = this.getGasPrice(),
    gasLimit = this.getGasLimit('unstake'),
  }) {
    await this.getInfo();

    const { fromBech32Address } = await zilliqaCryptoLib.get();

    return {
      version: TX_VERSION_MAINNET,
      toAddr: fromBech32Address(this.stakingProxyContract),
      amount: new this.BN(0),
      gasPrice: new this.BN(gasPrice),
      gasLimit: Long.fromNumber(gasLimit),
      nonce: this.getNonce(),
      pubKey: this.zilliqa.wallet.defaultAccount.publicKey,
      data: JSON.stringify({
        _tag: 'WithdrawStakeAmt',
        params: [
          {
            vname: 'ssnaddr',
            type: 'ByStr20',
            value: await this.toValidChecksumAddress(validator),
          },
          {
            vname: 'amt',
            type: 'Uint128',
            value: String(amount),
          },
        ],
      }),
    };
  }

  async completeWithdrawal() {
    await this.getInfo();

    const { fromBech32Address } = await zilliqaCryptoLib.get();

    return {
      version: TX_VERSION_MAINNET,
      toAddr: fromBech32Address(this.stakingProxyContract),
      amount: new this.BN(0),
      gasPrice: new this.BN(this.fee),
      gasLimit: Long.fromNumber(this.stakingFeeGas),
      nonce: this.getNonce(),
      pubKey: this.zilliqa.wallet.defaultAccount.publicKey,
      data: JSON.stringify({
        _tag: 'CompleteWithdrawal',
        params: [],
      }),
    };
  }

  async createClaimTransaction({
    validator = '',
    gasPrice = this.getGasPrice('claim'),
    gasLimit = this.getGasLimit('claim'),
  }) {
    await this.getInfo();

    const { fromBech32Address } = await zilliqaCryptoLib.get();

    return {
      version: TX_VERSION_MAINNET,
      toAddr: fromBech32Address(this.stakingProxyContract),
      amount: new this.BN(0),
      gasPrice: new this.BN(gasPrice),
      gasLimit: Long.fromNumber(gasLimit),
      nonce: this.getNonce(),
      pubKey: this.zilliqa.wallet.defaultAccount.publicKey,
      data: JSON.stringify({
        _tag: 'WithdrawStakeRewards',
        params: [
          {
            vname: 'ssnaddr',
            type: 'ByStr20',
            value: await this.toValidChecksumAddress(validator),
          },
        ],
      }),
    };
  }

  async createTokenTransaction({ address, amount, contract }) {
    await this.getInfo();

    const { fromBech32Address } = await zilliqaCryptoLib.get();

    return {
      version: TX_VERSION_MAINNET,
      toAddr: fromBech32Address(contract),
      amount: new this.BN(0),
      gasPrice: new this.BN(this.fee),
      gasLimit: Long.fromNumber(this.tokenFeeGas),
      nonce: this.getNonce(),
      pubKey: this.zilliqa.wallet.defaultAccount.publicKey,
      data: JSON.stringify({
        _tag: 'Transfer',
        params: [
          {
            vname: 'to',
            type: 'ByStr20',
            value: fromBech32Address(address),
          },
          {
            vname: 'amount',
            type: 'Uint128',
            value: String(amount),
          },
        ],
      }),
    };
  }

  /**
   * Creates a token.
   *
   * @param {...Array} args The arguments
   * @return {ETHToken}
   */
  createToken(args) {
    return new ZILToken({
      parent: this,
      ...args,
    });
  }

  getExcludedTokenList() {
    return [];
  }

  async fetchUserTokens() {
    return [];
  }

  async loadTokensList(wallets) {
    const newToken = this.createToken({
      name: GZIL.name,
      ticker: GZIL.ticker,
      decimal: GZIL.decimal,
      contract: GZIL.contract,
      uniqueField: GZIL.contract,
      visibility: true,
      confirmed: true,
      source: 'list',
    });

    wallets.addWallet(newToken);
    this.tokens[newToken.contract] = newToken;
  }

  getGasLimit(sendType = 'send') {
    switch (sendType) {
      case 'send':
        return this.sendFeeGas;
      case 'stake':
        return this.stakingFeeGas;
      case 'unstake':
        return this.unstakingFeeGas;
      case 'claim':
        return this.claimFeeGas;
      default:
        return this.sendFeeGas;
    }
  }

  getGasPrice(sendType = 'send') {
    return this.fee;
  }

  getGasRange(sendType = 'send') {
    return this.feeData[sendType] || this.feeData.gasSettings || this.feeDataDefaults.gasSettings;
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
  //   configManager.register('stake_validators_zil');
  //   const validators = await configManager
  //     .get('stake_validators_zil')
  //     .catch((error) => {
  //       // logger.error(error);
  //       return predefinedValidators.find(
  //         (item) => item.currency === this.ticker,
  //       );
  //     });
  //
  //   coinStaking.modifyPredefinedValidators(validators);
  // }
}

export default ZILCoin;
