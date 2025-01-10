import axios from 'axios';
import Explorer from 'src/explorers/explorer';

class DgbInsightExplorer extends Explorer {
  getAllowedTickers() {
    return ['BTC', 'LTC', 'ZEC', 'DGB', 'DASH', 'DOGE', 'BTG', 'QTUM'];
  }

  getInfoUrl(address) {
    return `addr/${address}`;
  }

  getTransactionUrl(txId) {
    return `tx/${txId}`;
  }

  getTransactionsUrl(address) {
    return `addrs/${address}/txs`;
  }

  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(response.items, address);
  }

  getUnspentOutputsUrl(address) {
    return `addr/${address}/utxo`;
  }

  getSendTransactionUrl() {
    return 'tx/send';
  }

  getSendTransactionParam() {
    return 'rawtx';
  }

  modifyInfoResponse(response) {
    return {
      balance: response.balanceSat,
      transactions: [],
    };
  }

  modifyUnspentOutputsResponse(response) {
    return response.map(({ address, txid, vout, scriptPubKey: script, satoshis: value }) => ({
      txid,
      vout,
      script,
      value,
      address,
    }));
  }

  async sendTransaction(rawtx) {
    const response = await axios.post(`${this.config.baseUrl}${this.getSendTransactionUrl()}`, {
      [this.getSendTransactionParam()]: rawtx,
    });

    return this.modifyGeneralResponse(this.modifySendTransactionResponse(response));
  }

  getTxOtherSideAddress(selfAddress, tx) {
    if (!tx.vin) {
      return '...';
    }

    if (this.getTxDirection(selfAddress, tx)) {
      return tx.vin[0].addr;
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

  getTxValue(selfAddress, tx) {
    let valueIn = new this.wallet.BN(0);
    let valueOut = new this.wallet.BN(0);

    tx.vin.forEach((input) => {
      if (input.addr === selfAddress) {
        valueIn = valueIn.add(new this.wallet.BN(input.valueSat));
      }
    });

    tx.vout.forEach((output) => {
      if (output.scriptPubKey.addresses) {
        if (output.scriptPubKey.addresses[0] === selfAddress) {
          valueOut = valueOut.add(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)));
        }
      }
    });

    const valueDiff = valueIn.sub(valueOut);
    const isInbound = valueDiff.lt(new this.wallet.BN(0));
    const value = valueDiff.abs();

    return Number(
      this.wallet.toCurrencyUnit(isInbound ? value : value.sub(new this.wallet.BN(this.wallet.toMinimalUnit(tx.fees)))),
    );
  }

  calculateBalance(utxos = []) {
    return utxos.reduce((acc, { value }) => new this.wallet.BN(value).add(acc), new this.wallet.BN('0'));
  }
}

export default DgbInsightExplorer;
