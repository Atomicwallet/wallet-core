import { InsufficientFundsError, WalletError } from 'src/errors';

import { SEND_TRANSACTION_TYPE, WALLET_ERROR } from '../../utils/const';

const BitcoinJSMixin = (superclass) =>
  class extends superclass {
    #privateKey;

    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemondic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    async loadWallet(seed) {
      const coreLibrary = await this.loadCoreLibrary();

      const hdPrivateKey = coreLibrary.HDNode.fromSeedBuffer(seed, await this.getNetwork());
      const key = hdPrivateKey.derivePath(this.derivation);

      if (!key.keyPair) {
        throw new WalletError({
          type: WALLET_ERROR,
          error: new Error("can't get a privateKey!"),
          instance: this,
        });
      }

      this.setPrivateKey(key.keyPair.toWIF());
      this.address = key.keyPair.getAddress();

      return {
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      };
    }

    async getNetwork() {
      const coreLibrary = await this.loadCoreLibrary();

      return coreLibrary.networks.mainnet;
    }

    /**
     * The address getter
     *
     * @return {String}
     */
    async getAddress(privateKey = this.#privateKey) {
      this.getKeyForSignFromPrivateKey(privateKey).getAddress();
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
        const coreLibrary = await this.loadCoreLibrary();

        coreLibrary.address.toOutputScript(address, await this.getNetwork());
        return true;
      } catch (error) {
        return false;
      }
    }

    async getTransactionBuilder() {
      const coreLibrary = await this.loadCoreLibrary();

      return new coreLibrary.TransactionBuilder(await this.getNetwork());
    }

    addInput(txBuilder, input) {
      txBuilder.addInput(input.txId, input.outputIndex);
    }

    signInput(txBuilder, keyForSign, index, input) {
      txBuilder.sign(index, keyForSign);
    }

    /**
     * Creates a claim transaction.
     *
     * @param {String} privateKey PrivateKey for claim
     * @return {Promise<String>} Raw transaction
     */

    async createClaimTransaction(privateKey) {
      // Claim coins from fork
      const forkAddress = this.getAddress(privateKey);

      if (!forkAddress || forkAddress.length === 0) {
        throw new WalletError({
          type: WALLET_ERROR,
          error: new Error("can't get a address from forked privateKey!"),
          instance: this,
        });
      }

      const utxo = await this.getUnspentOutputs(forkAddress);

      let forkBalance = this.explorer.calculateBalance(utxo);

      const fee = await this.getFee(forkBalance, true, forkAddress);

      forkBalance = new this.BN(forkBalance).sub(fee).toString();

      if (new this.BN(forkBalance).lt(new this.BN(0))) {
        throw new InsufficientFundsError({
          type: SEND_TRANSACTION_TYPE,
          error: new Error('Not enough otherside balance for claim'),
          instance: this,
        });
      }

      let totalAmount = new this.BN(0);
      const inputs = [];
      const needMoney = new this.BN(forkBalance).add(fee);

      utxo.forEach(({ txid, vout, address, script, value }) => {
        if (totalAmount.lt(needMoney)) {
          const itemAmount = new this.BN(value);

          totalAmount = totalAmount.add(itemAmount);
          inputs.push({
            txId: txid,
            outputIndex: vout,
            address,
            script,
            satoshis: parseInt(value, 10),
          });
        }
      });

      const change = totalAmount.sub(new this.BN(forkBalance)).sub(fee);

      if (change.lt(new this.BN(0))) {
        throw new InsufficientFundsError({
          type: SEND_TRANSACTION_TYPE,
          error: new Error('Insufficient funds!'),
          instance: this,
        });
      }

      const tx = await this.buildTx(inputs, this.address, forkBalance, change, privateKey, forkAddress);

      return tx;
    }

    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} privateKey PrivateKey for claim from forked
     * @return {Promise<String>} Raw transaction
     */
    async createTransaction({ address, amount }) {
      const utxo = await this.getUnspentOutputs(this.address, await this.getScriptPubKey());
      const fee = await this.getFee({ amount });

      let totalAmount = new this.BN(0);
      const inputs = [];
      const needMoney = new this.BN(amount).add(fee);

      utxo.forEach((unspent) => {
        if (totalAmount.lt(needMoney)) {
          const itemAmount = new this.BN(unspent.value);

          totalAmount = totalAmount.add(itemAmount);
          inputs.push({
            txId: unspent.txid,
            outputIndex: unspent.vout,
            address: unspent.address,
            script: unspent.script,
            satoshis: parseInt(unspent.value, 10),
          });
        }
      });

      const change = totalAmount.sub(new this.BN(amount)).sub(fee);

      if (change.lt(new this.BN(0))) {
        throw new InsufficientFundsError({
          type: SEND_TRANSACTION_TYPE,
          error: new Error('Insufficient funds!'),
          instance: this,
        });
      }

      return await this.buildTx(inputs, address, amount, change);
    }

    async buildTx(inputs, address, amount, change, privateKey, otherSideAddr = undefined) {
      const txBuilder = await this.getTransactionBuilder();

      inputs.forEach((input) => {
        this.addInput(txBuilder, input);
      });

      txBuilder.addOutput(address, parseInt(amount.toString(), 10));

      if (change.gt(new this.BN(0))) {
        txBuilder.addOutput(otherSideAddr || this.address, parseInt(change.toString(), 10));
      }

      const keyForSign = await this.getKeyForSignFromPrivateKey(privateKey);

      // sign transaction
      await Promise.all(inputs.map((input, index) => this.signInput(txBuilder, keyForSign, index, input)));

      return txBuilder.build().toHex();
    }

    async getKeyForSignFromPrivateKey(privateKey = this.#privateKey) {
      const coreLibrary = await this.loadCoreLibrary();

      return coreLibrary.ECPair.fromWIF(privateKey, await this.getNetwork());
    }

    async getScriptPubKey() {
      const coreLibrary = await this.loadCoreLibrary();

      return coreLibrary.address.toOutputScript(this.address, await this.getNetwork()).toString('hex');
    }

    setPrivateKey(privateKey) {
      this.#privateKey = privateKey;
    }
  };

export default BitcoinJSMixin;
