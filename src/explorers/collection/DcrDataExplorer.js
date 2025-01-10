import Explorer from '../Explorer';

class DcrDataExplorer extends Explorer {
  getAllowedTickers() {
    return ['DCR'];
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}/address/${address}/totals`;
  }

  modifyInfoResponse(response) {
    return {
      balance: this.wallet.toMinimalUnit(response.dcr_unspent),
      transactions: [],
    };
  }

  getTransactionUrl(txId) {
    return `${this.getApiPrefix()}/tx/${txId}`;
  }

  getTransactionsUrl(address, offset, limit) {
    return `${this.getApiPrefix()}/address/${address}/count/${limit}/skip/${offset}/raw`;
  }

  async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
    const response = await this.request(
      this.getTransactionsUrl(address, offset, limit),
      this.getTransactionsMethod(),
      this.getTransactionsParams(),
      'GetTxs',
    );

    return this.modifyTransactionsResponse(response, address);
  }

  /**
   * Gets the trasaction amount.
   *
   * @param {Object} tx The trasaction
   * @return {Number} The trasaction amount.
   */
  getTxValue(selfAddress, tx) {
    let valueIn = new this.wallet.BN(0);
    let valueOut = new this.wallet.BN(0);
    let totalValueIn = new this.wallet.BN(0);
    let totalValueOut = new this.wallet.BN(0);

    tx.vin.forEach((input) => {
      if (input.prevOut.addresses && input.prevOut.addresses.length > 0 && input.prevOut.addresses[0] === selfAddress) {
        valueIn = valueIn.add(new this.wallet.BN(this.wallet.toMinimalUnit(input.amountin)));
      }
      totalValueIn = totalValueIn.add(new this.wallet.BN(this.wallet.toMinimalUnit(input.amountin)));
    });

    tx.vout.forEach((output) => {
      if (output.scriptPubKey.addresses && output.scriptPubKey.addresses.length > 0) {
        if (output.scriptPubKey.addresses[0] === selfAddress) {
          valueOut = valueOut.add(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)));
        }
      }
      totalValueOut = totalValueOut.add(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)));
    });

    const valueDiff = valueIn.sub(valueOut);
    const isInbound = valueDiff.lt(new this.wallet.BN(0));
    const value = valueDiff.abs();
    const fee = totalValueIn.sub(totalValueOut);

    return Number(this.wallet.toCurrencyUnit(isInbound ? value : value.sub(fee)));
  }

  /**
   * Gets the trasaction direction.
   *
   * @param {Object} tx The trasaction
   * @return {Boolean} The trasaction direction.
   */
  getTxDirection(selfAddress, tx) {
    return (
      tx.vin &&
      !tx.vin.find(
        ({ prevOut }) => prevOut.addresses && prevOut.addresses.length > 0 && prevOut.addresses[0] === selfAddress,
      )
    );
  }

  /**
   * Gets the trasaction recipient.
   *
   * @param {Object} tx The transaction response.
   * @return {(Boolean|String)} The transaction recipient.
   */
  getTxOtherSideAddress(selfAddress, tx) {
    if (!tx.vin) {
      return '...';
    }

    if (this.getTxDirection(selfAddress, tx)) {
      return tx.vin[0].prevOut.addresses && tx.vin[0].prevOut.addresses.length > 0
        ? tx.vin[0].prevOut.addresses[0]
        : '...';
    }

    let valueOutPrev = new this.wallet.BN(0);
    let addressTo = '...';

    tx.vout.forEach((output) => {
      if (output.scriptPubKey.addresses.length > 0) {
        if (output.scriptPubKey.addresses[0] !== selfAddress) {
          if (valueOutPrev.lt(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)))) {
            valueOutPrev = new this.wallet.BN(this.wallet.toMinimalUnit(output.value));
            addressTo = output.scriptPubKey.addresses[0];
          }
        }
      }
    });

    return addressTo;
  }
}

export default DcrDataExplorer;
