import coinSelect from 'coinselect';
import { WalletError } from 'src/errors';

import { LOAD_WALLET_ERROR, LIB_NAME_INDEX } from '../../utils/const';

const { BITCORE } = LIB_NAME_INDEX;

const BitcoreMixin = (superclass) =>
  class extends superclass {
    #privateKey;
    /**
     * Loads a wallet.
     *
     * @param {String} seed The private key seed.
     * @return {Promise<Coin>} Self.
     */
    async loadWallet(seed) {
      const bitcoreLib = await this.loadLib(BITCORE);

      const hdPrivateKey = bitcoreLib.HDPrivateKey.fromSeed(seed, await this.getNetwork());
      const { privateKey } = hdPrivateKey[this.getDeriveFunctionName()](this.derivation);

      if (!privateKey) {
        throw new WalletError({
          type: LOAD_WALLET_ERROR,
          error: "can't derive privateKey!",
          instance: this,
        });
      }

      this.setPrivateKey(privateKey.toWIF());
      this.address = await this.getAddress();

      return {
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      };
    }

    async getNetwork() {
      const bitcoreLib = await this.loadLib(BITCORE);

      return bitcoreLib.Networks.get(this.networkName || 'mainnet');
    }

    getDeriveFunctionName() {
      return 'deriveChild';
    }

    /**
     * The address getter
     *
     * @return {String}
     */
    async getAddress() {
      const bitcoreLib = await this.loadLib(BITCORE);

      return bitcoreLib.PrivateKey.fromWIF(this.#privateKey.toString())
        .toAddress(await this.getNetwork())
        .toString();
    }

    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
      const bitcoreLib = await this.loadLib(BITCORE);

      return bitcoreLib.Address.isValid(address || this.address, await this.getNetwork());
    }

    async createTransaction({ address, amount, memo, userFee }) {
      const bitcoreLib = await this.loadLib(BITCORE);

      // TODO catch
      const utxos = await this.getUnspentOutputs(this.address, await this.getScriptPubKey());

      const satoshiFee = userFee ? Number(userFee) : Number(await this.getFee({ amount }));

      const BYTE_IN_KB = 1000;
      const tx = new bitcoreLib.Transaction().from(utxos).to(address, Number(amount)).fee(satoshiFee);

      if (this.ticker === 'XVG') {
        tx.timestamp = Number(new Date().getTime().toString().slice(0, -3));
      }

      if (Number(this.feePerByte) > 0) {
        tx.feePerKb(this.getFeePerByte() * BYTE_IN_KB);
      }

      tx.change(this.address);

      if (typeof tx.enableRBF === 'function') {
        tx.enableRBF();
      } else {
        console.warn(`[${this.ticker}] bitcore-lib does not have enableRBF function`);
      }

      return tx.sign(this.#privateKey).serialize();
    }

    async createTransactionSync({ inputs, outputs, fee }) {
      const bitcoreLib = await this.loadLib(BITCORE);

      const to = outputs
        .filter((out) => out.address)
        .map(({ address, value: satoshis }) => ({
          address,
          satoshis,
        }));

      const tx = new bitcoreLib.Transaction().from(inputs).to(to);

      if (fee) {
        tx.fee(fee).change(this.address);
      }

      if (typeof tx.enableRBF === 'function') {
        tx.enableRBF();
      } else {
        console.warn(`[${this.ticker}] bitcore-lib does not have enableRBF function`);
      }

      return tx.sign(this.#privateKey).serialize();
    }

    async getScriptPubKey() {
      const bitcoreLib = await this.loadLib(BITCORE);

      return bitcoreLib.Script.fromAddress(this.address).toHex();
    }

    async decodeTransaction(rawtx) {
      const bitcoreLib = await this.loadLib(BITCORE);

      return new bitcoreLib.Transaction(rawtx);
    }

    async getCoins({ address, value, feePerByte }) {
      const utxo = await this.getUnspentOutputs(this.address, await this.getScriptPubKey());

      const mappedUtxo = utxo.map((out) => ({
        ...out,
        value: Number(out.value),
      }));

      const result = coinSelect(
        mappedUtxo,
        [
          {
            address,
            value,
          },
        ],
        feePerByte,
      );

      // .inputs and .outputs will be undefined if no solution was found
      if (!result.inputs || !result.outputs) {
        throw new Error('Could not select utxos');
      }

      return result;
    }

    setPrivateKey(privateKey) {
      this.#privateKey = privateKey;
    }
  };

export default BitcoreMixin;
