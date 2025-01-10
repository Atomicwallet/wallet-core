import Explorer from '../Explorer';

class BlockcypherExplorer extends Explorer {
  getAllowedTickers() {
    return ['BTC', 'LTC', 'DOGE'];
  }

  getApiPrefix() {
    return `v1/${this.wallet.ticker.toLowerCase()}/`;
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}addrs/${address}`;
  }

  getUnspentOutputsUrl(address) {
    return `${this.getApiPrefix()}addrs/${address}?unspentOnly=true`;
  }

  getSendTransactionUrl() {
    return 'txs/push';
  }

  getSendTransactionParam() {
    return 'tx';
  }

  getTransactionUrl(txId) {
    return `${this.getApiPrefix()}main/txs/${txId}?limit=9999`;
  }

  getTransactionsUrl(address) {
    return `${this.getApiPrefix()}main/addrs/${address}/full`;
  }

  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(response.txs, address);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(selfAddress, tx) {
    return (
      tx.inputs &&
      !tx.inputs.find(({ addresses }) => addresses[0] === selfAddress) &&
      true
    );
  }

  getTxOtherSideAddress(selfAddress, tx) {
    if (!tx.inputs) {
      return '...';
    }

    if (this.getTxDirection(selfAddress, tx)) {
      return tx.inputs[0].addresses[0];
    }

    let valueOutPrev = new this.wallet.BN(0);
    let addressTo = '...';

    tx.outputs.forEach((output) => {
      if (output.addresses.length > 0) {
        if (output.addresses[0] !== selfAddress) {
          if (valueOutPrev.lt(new this.wallet.BN(output.value))) {
            valueOutPrev = new this.wallet.BN(output.value);
            addressTo = output.addresses[0];
          }
        }
      }
    });

    return addressTo;
  }

  getTxValue(selfAddress, tx) {
    let valueIn = new this.wallet.BN(0);
    let valueOut = new this.wallet.BN(0);

    tx.inputs.forEach((input) => {
      if (input.addresses[0] === selfAddress) {
        valueIn = valueIn.add(new this.wallet.BN(input.output_value));
      }
    });

    tx.outputs.forEach((output) => {
      if (output.addresses) {
        if (output.addresses[0] === selfAddress) {
          valueOut = valueOut.add(new this.wallet.BN(output.value));
        }
      }
    });

    const valueDiff = valueIn.sub(valueOut);
    const isInbound = valueDiff.lt(new this.wallet.BN(0));
    const value = valueDiff.abs();

    return Number(
      this.wallet.toCurrencyUnit(
        isInbound ? value : value.sub(new this.wallet.BN(tx.fees)),
      ),
    );
  }

  getTxDateTime(tx) {
    return new Date(tx.confirmed);
  }

  getTxConfirmations(tx) {
    return tx.confirmations;
  }
}

export default BlockcypherExplorer;
