import bitcoinCashAddressTools from 'bchaddrjs';
import { LIB_NAME_INDEX } from 'src/utils/const';

const { BITCORE } = LIB_NAME_INDEX;

const BitcoreBitcoinCashMixin = (superclass) =>
  class extends superclass {
    #privateKey;
    /**
     * The address getter
     *
     * @return {String}
     */
    async getAddress() {
      const bitcoreLib = await this.loadLib(BITCORE);

      let address = bitcoreLib.PrivateKey.fromWIF(this.#privateKey.toString())
        .toAddress(await this.getNetwork())
        .toString();

      if (!bitcoinCashAddressTools.isCashAddress(address)) {
        address = this.convertToCashAddress(address);
      }

      return address;
    }

    /**
     * Convert cash address to legacy
     *
     * @return {String}
     */
    convertToLegacyAddress(address) {
      return bitcoinCashAddressTools.toLegacyAddress(address);
    }

    /**
     * Convert legacy address to cash
     *
     * @return {String}
     */
    convertToCashAddress(address) {
      return bitcoinCashAddressTools.toCashAddress(address);
    }

    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
      try {
        return bitcoinCashAddressTools.isLegacyAddress(address) || bitcoinCashAddressTools.isCashAddress(address);
      } catch (error) {
        return false;
      }
    }

    /**
     * @param address
     * @param amount
     * @return {Promise<string>}
     */
    async createTransaction({ address, amount }) {
      const bitcoreLib = await this.loadLib(BITCORE);

      const utxos = await this.getUnspentOutputs();
      const fee = Number(await this.getFee(amount));
      const BYTE_IN_KB = 1000;

      const addressTo = bitcoinCashAddressTools.isCashAddress(address)
        ? address
        : bitcoinCashAddressTools.toCashAddress(address);

      const addressFrom = bitcoinCashAddressTools.isCashAddress(this.address)
        ? this.address
        : bitcoinCashAddressTools.toCashAddress(this.address);

      const tx = new bitcoreLib.Transaction()
        .from(utxos)
        .to(addressTo, Number(amount))
        .fee(fee)
        .feePerKb(this.getFeePerByte() * BYTE_IN_KB)
        .change(addressFrom)
        .sign(this.#privateKey);

      return tx.serialize();
    }

    setPrivateKey(privateKey) {
      super.setPrivateKey(privateKey);
      this.#privateKey = privateKey;
    }
  };

export default BitcoreBitcoinCashMixin;
