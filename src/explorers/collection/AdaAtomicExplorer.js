import BN from 'bn.js';
import Explorer from 'src/explorers/explorer';
import { SEND_TRANSACTION_TYPE } from 'src/utils';

class AdaAtomicExplorer extends Explorer {
  getAllowedTickers() {
    return ['ADA'];
  }

  getApiPrefix() {
    return '/';
  }

  getLatestBlockUrl() {
    return `${this.getApiPrefix()}lastblock`;
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}balance`;
  }

  getInfoParams(address) {
    return { address };
  }

  getAccountStateUrl() {
    return `${this.getApiPrefix()}stakingAccount`;
  }

  getTransactionUrl() {
    return `${this.getApiPrefix()}tx`;
  }

  getTransactionParams(txid) {
    return { txid };
  }

  getTransactionsUrl() {
    return `${this.getApiPrefix()}txs`;
  }

  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
    return { address, limit };
  }

  getUnspentOutputsUrl() {
    return `${this.getApiPrefix()}utxo`;
  }

  getUnspentOutputsParams(address) {
    return { address };
  }

  getSendTransactionUrl() {
    return `${this.getApiPrefix()}submit`;
  }

  getSendTransactionMethod() {
    return 'POST';
  }

  getSendTransactionParams(rawtx) {
    return {
      tx: Buffer.from(rawtx).toString('hex'), // Buffer.from(rawtx.txBody, 'hex'),
      network: 'mainnet', // optional
    };
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(selfAddress, tx) {
    return !tx.inputs.find(({ address }) => {
      return selfAddress === address;
    });
  }

  getTxOtherSideAddress(selfAddress, tx) {
    const outgoing = !this.getTxDirection(selfAddress, tx);

    if (outgoing) {
      const outgoingOutput = tx.outputs.find(({ address }) => address !== selfAddress);

      if (outgoingOutput) {
        return outgoingOutput.address;
      }
    } else {
      const incomingOutput = tx.inputs.find(({ address }) => address !== selfAddress);

      return incomingOutput.address;
    }

    return selfAddress;
  }

  getTxValueSatoshis(selfAddress, tx) {
    const incoming = this.getTxDirection(selfAddress, tx);

    const sentToMyself = tx.inputs.concat(tx.outputs).every(({ address }) => address === selfAddress);

    if (sentToMyself) {
      return tx.outputs.reduce((acc, out) => {
        return acc.add(new BN(out.value));
      }, new BN('0'));
    }

    const satoshis = tx.outputs.reduce((acc, out) => {
      if (incoming) {
        if (out.address === selfAddress) {
          return acc.add(new BN(out.value));
        }

        return acc;
      }

      if (out.address !== selfAddress) {
        return acc.add(new BN(out.value));
      }

      return acc;
    }, new BN('0'));

    return satoshis;
  }

  getTxValue(selfAddress, tx) {
    return this.wallet.toCurrencyUnit(this.getTxValueSatoshis(selfAddress, tx));
  }

  getTxDateTime(tx) {
    return new Date(tx.block.time);
  }

  async getBalance(address) {
    const response = await this.getInfo(address);

    return response && response.balance;
  }

  async getAccountState(address) {
    return this.request(this.getAccountStateUrl(), 'get', { address }, this.getInfoOptions()).catch((error) =>
      console.warn('Error', error),
    );
  }

  modifyInfoResponse(response) {
    let balance = response.balance;

    if (Number(balance) === 0) {
      balance = '0';
    }

    return {
      balance,
    };
  }

  modifyUnspentOutputsResponse(address, response) {
    return response.map(({ amount, hash, tx_index, receiver }) => {
      return {
        amount,
        tx_hash: hash,
        tx_index,
        receiver,
      };
    });
  }

  modifySendTransactionResponse(response, txid) {
    console.warn('RESPONSE', response);
    return {
      txid,
    };
  }

  async sendTransaction({ rawtx, txid }) {
    const response = await this.request(
      this.getSendTransactionUrl(),
      this.getSendTransactionMethod(),
      this.getSendTransactionParams(rawtx),
      SEND_TRANSACTION_TYPE,
      this.getSendOptions(),
    );

    return this.modifySendTransactionResponse(response, txid);
  }

  getTxFee() {
    return null;
  }

  getTxConfirmations() {
    return 1;
  }
}

export default AdaAtomicExplorer;
