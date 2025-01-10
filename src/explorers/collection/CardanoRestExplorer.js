import BN from 'bn.js';

import Explorer from '../Explorer';

class CardanoRestExplorer extends Explorer {
  getAllowedTickers() {
    return ['ADA'];
  }

  getTxHash(tx) {
    return tx.ctbId;
  }

  getTxDirection(selfAddress, tx) {
    return !tx.ctbInputs.find(({ ctaAddress }) => {
      return selfAddress === ctaAddress;
    });
  }

  getTxOtherSideAddress(selfAddress, tx) {
    const outgoing = !this.getTxDirection(selfAddress, tx);

    if (outgoing) {
      const outgoingOutput = tx.ctbOutputs.find(({ ctaAddress }) => ctaAddress !== selfAddress);

      if (outgoingOutput) {
        return outgoingOutput.ctaAddress;
      }
    } else {
      const incomingOutput = tx.ctbInputs.find(({ ctaAddress }) => ctaAddress !== selfAddress);

      return incomingOutput.ctaAddress;
    }

    return selfAddress;
  }

  getTxValue(selfAddress, tx) {
    const incoming = this.getTxDirection(selfAddress, tx);

    const sentToMyself = tx.ctbInputs.concat(tx.ctbOutputs).every(({ ctaAddress }) => ctaAddress === selfAddress);

    if (sentToMyself) {
      return this.wallet.toCurrencyUnit(tx.ctbFees.getCoin);
    }

    const satoshis = tx.ctbOutputs.reduce((acc, out) => {
      if (incoming) {
        if (out.ctaAddress === selfAddress) {
          return acc.add(new BN(out.ctaAmount.getCoin));
        }

        return acc;
      }

      if (out.ctaAddress !== selfAddress) {
        return acc.add(new BN(out.ctaAmount.getCoin));
      }

      return acc;
    }, new BN('0'));

    return this.wallet.toCurrencyUnit(satoshis);
  }

  getTxDateTime(tx) {
    return new Date(tx.ctbTimeIssued * 1000);
  }

  async getBalance(address) {
    const utxos = await this.getUnspentOutputs(address);

    const balance = utxos.reduce((prev, cur) => {
      return prev.add(new BN(cur.amount));
    }, new BN(0));

    return balance;
  }

  async sendTransaction({ rawtx }) {
    const result = await this.request('api/submit/tx', 'post', Buffer.from(rawtx), undefined, {
      headers: {
        'Content-Type': 'application/cbor',
        'API-key': this.config.options ? this.config.options['API-key'] : undefined,
      },
    });

    return { txid: result };
  }

  /**
   * Gets the utxo.
   *
   * @return {Promise} The utxo.
   */
  async getUnspentOutputs(address) {
    const result = await this.request(`mainnet/utxos/${address}`, 'get');

    return result.map((utxo) => {
      return {
        amount: String(utxo.coin),
        tx_hash: utxo.txid,
        tx_index: utxo.index,
        receiver: utxo.address,
      };
    });
  }

  async getTransactions({ address }) {
    const response = await this.request(`api/addresses/summary/${address}`, 'get');

    if (response.Left) {
      throw new Error(response.Left);
    }

    return this.modifyTransactionsResponse(response.Right && response.Right.caTxList, address);
  }

  async getInfo(address) {
    const response = await this.request(`api/addresses/summary/${address}`, 'get');

    const balance = response.Right && response.Right.caBalance.getCoin;
    const transactions = response.Right && response.Right.caTxList;

    return {
      balance,
      transactions,
    };
  }
}

export default CardanoRestExplorer;
