import BN from 'bn.js';

import { Coin } from '../../abstract';
import ElrondApiExplorer from '../../explorers/collection/ElrondApiExplorer';
import { Amount, LazyLoadedLib } from '../../utils';
import { HasProviders, StakingMixin } from '../mixins';

const elrondCoreJsLazyLoaded = new LazyLoadedLib(
  () => import('@elrondnetwork/elrond-core-js'),
);
const elrondJsLazyLoaded = new LazyLoadedLib(
  () => import('@elrondnetwork/erdjs'),
);
const elrondJsOutSignatureLazyLoaded = new LazyLoadedLib(
  () => import('@elrondnetwork/erdjs/out/signature'),
);

const NAME = 'MultiversX';
const TICKER = 'EGLD';
const DERIVATION = "m/44'/508'/0'/0'/0'";
const DECIMAL = 18;
const MAINNET = '1'; // 'T' for testnet, 'D' for devnet
const UNSPENDABLE_BALANCE = '0';
const DEFAULT_RESERVE_FOR_STAKE = '10000';

const DEFAULT_GAS_PRICE = 1000000000;
const DEFAULT_GAS_LIMIT = 50000;
const DEFAULT_STAKING_GAS_LIMIT = 10000000;

/**
 * Hexadecimal amounts in data should be odd
 * egld node requirement
 */
const paddedHexAmount = (amount) => {
  amount = new BN(amount).toString(16);

  if (amount.length % 2 === 1) {
    return `0${amount}`;
  }

  return amount;
};

const STAKING_ACTIONS = {
  STAKE: 'delegate',
  UNSTAKE: (amount) => `unDelegate@${paddedHexAmount(amount)}`,
  CLAIM: 'claimRewards',
  WITHDRAW: 'withdraw',
};

class EGLDCoin extends StakingMixin(HasProviders(Coin)) {
  #privateKey;

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

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([ElrondApiExplorer]);

    this.loadExplorers(config);

    this.gasPrice = feeData.gasPrice || DEFAULT_GAS_PRICE;
    this.gasLimit = feeData.gasLimit || DEFAULT_GAS_LIMIT;
    this.stakingGasLimit = feeData.stakingGasLimit || DEFAULT_STAKING_GAS_LIMIT;
    this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_FOR_STAKE;

    this.eventEmitter.on(
      `${this.ticker}::confirmed-socket-tx`,
      (_, unconfirmedTx) => {
        this.getInfo();

        if (unconfirmedTx && unconfirmedTx.direction) {
          this.eventEmitter.emit('socket::newtx', {
            id: this.id,
            ticker: this.ticker,
            amount: unconfirmedTx.amount,
            txid: unconfirmedTx.txid,
          });
        } else {
          this.eventEmitter.emit('socket::newtx::outgoing', {
            id: this.id,
            ticker: this.ticker,
          });
        }
      },
    );
  }

  async loadWallet(seed, mnemonic) {
    const { account: Account } = await elrondCoreJsLazyLoaded.get();

    const account = new Account();

    // default seed generated from bip32, should be regenerated from bip39
    seed = account.privateKeyFromMnemonic(mnemonic);

    account.loadFromSeed(Buffer.from(seed, 'hex'));

    this.#privateKey = account.privateKeyAsString();
    this.address = account.address();

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  async createTransaction({ address, amount, data = '', gasLimit }) {
    const [
      { Address, Transaction, TransactionPayload },
      { Signature },
      { account: Account },
    ] = await Promise.all([
      elrondJsLazyLoaded.get(),
      elrondJsOutSignatureLazyLoaded.get(),
      elrondCoreJsLazyLoaded.get(),
    ]);

    const sender = Address.fromBech32(this.address);

    const tx = new Transaction({
      nonce: this.nonce,
      value: amount,
      receiver: Address.fromBech32(address),
      sender,
      gasPrice: Number(this.gasPrice),
      gasLimit: Number(gasLimit || this.gasLimit),
      data: new TransactionPayload(data),
      chainID: MAINNET,
      version: 1,
    });

    const msg = tx.serializeForSigning(sender);

    const account = new Account();

    account.loadFromPrivateKey(Buffer.from(this.#privateKey, 'hex'));

    tx.applySignature(Signature.fromHex(account.sign(msg)), sender);
    return tx.toSendable();
  }

  createDelegationTransaction({ validator, amount }) {
    return this.createTransaction({
      address: validator,
      amount,
      data: STAKING_ACTIONS.STAKE,
      gasLimit: this.stakingGasLimit,
    });
  }

  createUnDelegationTransaction({ validator, amount }) {
    return this.createTransaction({
      address: validator,
      amount: '0',
      data: STAKING_ACTIONS.UNSTAKE(amount),
      gasLimit: this.stakingGasLimit,
    });
  }

  createClaimTransaction({ validator }) {
    return this.createTransaction({
      address: validator,
      amount: '0',
      data: STAKING_ACTIONS.CLAIM,
      gasLimit: this.stakingGasLimit,
    });
  }

  createWithdrawTransaction({ validator }) {
    return this.createTransaction({
      address: validator,
      amount: '0',
      data: STAKING_ACTIONS.WITHDRAW,
      gasLimit: this.stakingGasLimit,
    });
  }

  calculateTotal({
    balance,
    staked,
    unstaking,
    availableWithdrawals,
    rewards,
  }) {
    return new Amount(
      balance
        .toBN()
        .add(staked.toBN())
        .add(unstaking.toBN())
        .add(rewards.toBN())
        .add(availableWithdrawals.toBN())
        .toString(),
      this,
    );
  }

  async calculateAvailableForStake({ balance }) {
    const fees = await this.getFee({ gasLimit: this.stakingGasLimit });

    const available = balance
      .toBN()
      .sub(new this.BN(this.reserveForStake))
      .sub(fees)
      .sub(new this.BN(this.unspendableBalance));

    return new Amount(available.isNeg() ? '0' : available, this);
  }

  async sendTransaction(rawtx) {
    const tx = await this.getProvider('send').sendTransaction(rawtx);

    if (tx) {
      this.nonce = Number(this.nonce) + 1;
    }

    return tx;
  }

  async getInfo() {
    const { balance, nonce } = await this.getProvider('balance').getInfo(
      this.address,
    );

    if (balance) {
      this.balance = balance;
    }

    if (nonce) {
      this.nonce = Number(nonce || '0');
    }

    await this.getStakingInfo();

    return { balance: this.balance, balances: this.balances };
  }

  getFee({ gasLimit, userGasPrice } = {}) {
    return new BN(String(userGasPrice || this.gasPrice)).mul(
      new this.BN(gasLimit || this.gasLimit),
    );
  }

  async validateAddress(address) {
    try {
      const { Address } = await elrondJsLazyLoaded.get();

      return !!Address.fromBech32(address);
    } catch (error) {
      return false;
    }
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}

export default EGLDCoin;
