import { WalletError, InsufficientFundsError } from 'src/errors';
import { SEND_TRANSACTION_TYPE, WALLET_ERROR, LIB_NAME_INDEX } from 'src/utils';

const { BITCOINJS } = LIB_NAME_INDEX;

const BitcoinJSMixin = (superclass) =>
  class extends superclass {
    #privateKey;

    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    async loadWallet(seed) {
      const bitcoinJs = await this.loadLib(BITCOINJS);

      const hdPrivateKey = bitcoinJs.bip32.fromSeed(seed, await this.getNetwork());
      const keys = hdPrivateKey.derivePath(this.derivation);

      if (!keys) {
        throw new WalletError({
          type: WALLET_ERROR,
          error: new Error("can't get a privateKey!"),
          instance: this,
        });
      }

      const privateKey = keys.toWIF();

      await this.setPrivateKey(privateKey);
      this.address = await this.getAddress(privateKey);

      return {
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      };
    }

    async getNetwork() {
      const bitcoreLib = await this.loadLib(BITCOINJS);

      return bitcoreLib.networks[this.networkName] || this.network;
    }

    /**
     * The address getter
     *
     * @return {String}
     */
    async getAddress(privateKey = this.#privateKey) {
      const keys = await this.getKeyForSignFromPrivateKey(privateKey);

      return privateKey
        ? this.getAddressFromPublicKey(keys.publicKey)
        : new WalletError({
            type: WALLET_ERROR,
            error: new Error('privateKey is empty!'),
            instance: this,
          });
    }

    async getAddressFromPublicKey(publicKey) {
      const bitcoinJs = await this.loadLib(BITCOINJS);

      return bitcoinJs.payments.p2pkh({
        pubkey: publicKey,
        network: await this.getNetwork(),
      }).address;
    }

    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
      const bitcoinJs = await this.loadLib(BITCOINJS);

      if (!address) {
        return false;
      }
      try {
        bitcoinJs.address.toOutputScript(address, await this.getNetwork());
        return true;
      } catch (error) {
        return false;
      }
    }

    async getTransactionBuilder() {
      const bitcoinJs = await this.loadLib(BITCOINJS);

      return new bitcoinJs.TransactionBuilder(await this.getNetwork());
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
      const forkAddress = await this.getAddress(privateKey);

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

      const tx = await this.buildTx(inputs, this.address, forkBalance, change, privateKey, forkAddress, 1);

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
      const utxo = await this.getUnspentOutputs();

      const fee = await this.getFee({ utxos: utxo });

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
            addres: unspent.address,
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

      const tx = await this.buildTx(inputs, address, amount, change, undefined, undefined, 1);

      return tx;
    }

    async buildTx(inputs, address, amount, change, privateKey, otherSideAddr = undefined, version) {
      return new Promise(async (resolve, reject) => {
        const txBuilder = await this.getTransactionBuilder();

        if (version && this.ticker !== 'BCD') {
          txBuilder.setVersion(version);
        }

        inputs.forEach((input) => {
          this.addInput(txBuilder, input);
        });

        txBuilder.addOutput(address, parseInt(amount.toString(), 10));

        if (change.gt(new this.BN(0))) {
          txBuilder.addOutput(otherSideAddr || this.address, parseInt(change.toString(), 10));
        }

        const keyForSign = await this.getKeyForSignFromPrivateKey(privateKey);

        // sign transaction
        await Promise.all(
          inputs.map(async (input, index) => this.signInput(txBuilder, keyForSign, index, input)),
        ).catch(reject);

        try {
          const tx = txBuilder.build().toHex();

          resolve(tx);
        } catch (error) {
          reject(error);
        }
      });
    }

    async getKeyForSignFromPrivateKey(privateKey = this.#privateKey) {
      const bitcoinJs = await this.loadLib(BITCOINJS);

      return bitcoinJs.ECPair.fromWIF(privateKey, await this.getNetwork());
    }

    async getScriptPubKey() {
      const bitcoinJs = await this.loadLib(BITCOINJS);

      return bitcoinJs.address.toOutputScript(this.address, await this.getNetwork()).toString('hex');
    }

    setPrivateKey(privateKey) {
      this.#privateKey = privateKey;
    }
  };

export default BitcoinJSMixin;
