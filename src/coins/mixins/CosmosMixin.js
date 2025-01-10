import bech32 from 'bech32';
import * as BitcoinJS from 'bitcoinjs-lib';
import { createSignedTx, sign } from 'js-cosmos-wallet';
import wif from 'wif';

import { ExplorerRequestError, WalletError } from '../../errors';
import {
  ATOM_MSG_TYPES,
  GET_TRANSACTIONS_TYPE,
  WALLET_ERROR,
} from '../../utils/const';
import { CosmosTxTypes } from '../libs';

const CosmosMixin = (superclass) =>
  class extends superclass {
    #privateKey;
    constructor(config) {
      super(...arguments);

      this.denom = 'uatom';
    }

    async loadWallet(seed) {
      const hdPrivateKey = BitcoinJS.bip32.fromSeed(seed);
      const key = hdPrivateKey.derivePath(this.derivation);

      if (!key) {
        throw new WalletError({
          type: WALLET_ERROR,
          error: new Error("can't get a privateKey!"),
          instance: this,
        });
      }

      const publicKeyHash = BitcoinJS.crypto.hash160(key.publicKey);

      this.#privateKey = key.toWIF();
      this.address = bech32.encode(this.prefix, bech32.toWords(publicKeyHash));

      return {
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      };
    }

    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress() {
      if (this.#privateKey) {
        const keyPair = BitcoinJS.ECPair.fromWIF(this.#privateKey);
        const publicKeyHash = BitcoinJS.crypto.hash160(keyPair.publicKey);

        return bech32.encode(this.prefix, bech32.toWords(publicKeyHash));
      }

      return new WalletError({
        type: WALLET_ERROR,
        error: new Error('privateKey is empty!'),
        instance: this,
      });
    }

    getSignKeys() {
      const keyPair = BitcoinJS.ECPair.fromWIF(this.#privateKey);
      const privateKeyBuffer = wif.decode(this.#privateKey);

      return {
        privateKey: privateKeyBuffer.privateKey.toString('hex'),
        publicKey: keyPair.publicKey.toString('hex'),
      };
    }

    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
      try {
        const { prefix } = bech32.decode(address);

        return prefix === this.prefix;
      } catch (error) {
        // throw new Error(`Fail to validate ${this.ticker} address [${address}]`)
        return false;
      }
    }

    async getTransaction(txId) {
      return this.getProvider('history').getTransaction(this.address, txId);
    }

    async getTransactions({
      address = this.address,
      offset = 0,
      limit = this.explorer.defaultTxLimit,
      pageNum = 0,
    }) {
      this.transactions = await this.getProvider('history')
        .getTransactions({ address, offset, limit, pageNum })
        .catch((error) => {
          throw new ExplorerRequestError({
            type: GET_TRANSACTIONS_TYPE,
            error,
            instance: this,
          });
        });

      return this.transactions;
    }

    async getTransactionBlueprint({ type, ...params }) {
      if (CosmosTxTypes[type]) {
        return CosmosTxTypes[type](params);
      }

      if (type === ATOM_MSG_TYPES.Withdraw) {
        return this.getProvider('send').getTransactionRewardsBlueprint({
          from: this.address,
          ...params,
        });
      }

      throw new Error(`[${this.ticker}] no ${type} tx blueprint found`);
    }

    async signTransaction(transaction) {
      const wallet = this.getSignKeys();
      const { sequence = '0', account_number } = await this.getProvider(
        'send',
      ).getAuth(this.address);
      const signature = sign(transaction, wallet, {
        sequence,
        account_number,
        chain_id: this.getProvider('send').getChainId(),
      });

      return createSignedTx(transaction, signature);
    }

    async createTransaction({ address, amount, memo = '' }) {
      const fee = (await this.getFee()).toString();
      const txBlueprint = await this.getTransactionBlueprint({
        type: ATOM_MSG_TYPES.Send,
        fromAddress: this.address,
        toAddress: address,
        amount: new this.BN(amount).toString(),
        fee,
        memo,
        gas: this.sendFeeGas,
        denom: this.denom,
      });

      const tx = await this.signTransaction(txBlueprint);

      return {
        tx,
        mode: 'sync',
      };
    }

    async sendTransaction(rawtx) {
      return this.getProvider('send').sendTransaction(rawtx);
    }

    async createDelegationTransaction(validator, amount, memo = '') {
      const fee = (await this.getFee()).toString();
      const txBlueprint = await this.getTransactionBlueprint({
        type: ATOM_MSG_TYPES.Delegate,
        delegatorAddress: this.address,
        validatorAddress: validator,
        amount: new this.BN(amount).toString(),
        fee,
        gas: this.stakingFeeGas,
        memo,
        denom: this.denom,
      });
      const tx = await this.signTransaction(txBlueprint);

      return {
        tx,
        mode: 'sync',
      };
    }

    async createRedelegationTransaction(
      fromValidator,
      validator,
      amount,
      memo = '',
    ) {
      const fee = (await this.getFee()).toString();
      const txBlueprint = await this.getTransactionBlueprint({
        type: ATOM_MSG_TYPES.Redelegate,
        delegatorAddress: this.address,
        validatorSrcAddress: fromValidator,
        validatorDstAddress: validator,
        amount: new this.BN(amount).toString(),
        fee,
        gas: this.stakingFeeGas,
        memo,
        denom: this.denom,
      });
      const tx = await this.signTransaction(txBlueprint);

      return {
        tx,
        mode: 'sync',
      };
    }

    async createUnbondingDelegationTransaction(validator, amount) {
      const fee = (await this.getFee()).toString();
      const txBlueprint = await this.getTransactionBlueprint({
        type: ATOM_MSG_TYPES.Undelegate,
        delegatorAddress: this.address,
        validatorAddress: validator,
        amount: new this.BN(amount).toString(),
        fee,
        gas: this.stakingFeeGas,
        denom: this.denom,
      });
      const tx = await this.signTransaction(txBlueprint);

      return {
        tx,
        mode: 'sync',
      };
    }

    // Withdraw all the delegator's delegation rewards
    async createWithdrawDelegationTransaction() {
      const fee = (await this.getFee()).toString();
      const txBlueprint = await this.getTransactionBlueprint({
        type: ATOM_MSG_TYPES.Withdraw,
        delegatorAddress: this.address,
        fee,
        gas: this.claimFeeGas,
        chain_id: this.chainId,
        denom: this.denom,
      });

      const tx = await this.signTransaction(txBlueprint);

      return {
        tx,
        mode: 'sync',
      };
    }

    async getInfo() {
      const { balance, balances } = await this.getProvider('balance').getInfo(
        this.address,
      );

      this.balance = balance;
      this.balances = balances;

      return {
        balance: this.balance,
        balances: this.balances,
      };
    }

    setPrivateKey(privateKey) {
      this.#privateKey = privateKey;
    }
  };

export default CosmosMixin;
