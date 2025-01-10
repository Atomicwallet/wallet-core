import nem from 'nem-sdk';
import { ExplorerRequestError } from 'src/errors';

import { hex2a } from '../../utils';
import { SEND_TRANSACTION_TYPE } from '../../utils/const';
import Explorer from '../Explorer';

/**
 * NemNodeExplorer
 */
const NETWORK = nem.model.network.data.mainnet;

class NemNodeExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.endpoint = nem.model.objects.create('endpoint')(this.config.baseUrl, nem.model.nodes.defaultPort);
  }

  getAllowedTickers() {
    return ['XEM'];
  }

  getWalletAddress() {
    return this.wallet.address;
  }

  updateEndpoint(baseUrl) {
    this.config.baseUrl = baseUrl;
    this.endpoint = nem.model.objects.create('endpoint')(baseUrl, nem.model.nodes.defaultPort);
  }

  async getInfo(address) {
    const response = await nem.com.requests.account.data(this.endpoint, address);

    return this.modifyInfoResponse(response);
  }

  modifyInfoResponse(response) {
    return {
      balance: response.account.balance,
      transactions: this.wallet.transactions,
    };
  }

  async getTransaction(txId) {
    const response = await nem.com.requests.transaction.byHash(this.endpoint, txId);

    return this.modifyTransactionResponse(response);
  }

  async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
    this.latestBlock = await this.getLatestBlock();
    const response = await nem.com.requests.account.transactions.all(this.endpoint, address);

    return this.modifyTransactionsResponse(response.data, address);
  }

  async getLatestBlock() {
    const latestBlock = await nem.com.requests.chain.height(this.endpoint);

    return latestBlock;
  }

  getTxHash(tx) {
    return tx.meta.hash.data;
  }

  getTxDateTime(tx) {
    // https://github.com/QuantumMechanics/NEM-sdk/blob/cd532ca41403123ac1b919b94a7b568982428ec8/src/utils/helpers.js#L100

    const NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);

    const timestamp = Number(tx.transaction.timeStamp) * 1000 + NEM_EPOCH;

    return new Date(Number(`${timestamp}`));
  }

  getTxMemo(tx) {
    return hex2a(tx.transaction.message.payload);
  }

  getTxDirection(selfAddress, tx) {
    return selfAddress === tx.transaction.recipient;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx)
      ? nem.model.address.toAddress(tx.transaction.signer, NETWORK.id)
      : tx.transaction.recipient;
  }

  getTxValue(selfAddress, tx) {
    return Number(
      this.wallet.toCurrencyUnit(
        this.getTxDirection(selfAddress, tx)
          ? tx.transaction.amount
          : new this.wallet.BN(tx.transaction.amount).add(new this.wallet.BN(tx.transaction.fee)),
      ),
    );
  }

  getTxConfirmations(tx) {
    if (this.latestBlock) {
      return this.latestBlock.height - tx.meta.height;
    }
    return Number(1);
  }

  async sendTransaction(rawtx) {
    try {
      const response = await nem.com.requests.transaction.announce(this.endpoint, rawtx);

      return this.modifySendTransactionResponse(response);
    } catch (error) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error,
        instance: this,
      });
    }
  }

  modifySendTransactionResponse(response) {
    if (response.message !== 'SUCCESS') {
      throw new Error(response.message);
    }
    return {
      txid: response.transactionHash.data,
    };
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit((tx && tx.transaction && tx.transaction.fee) || 0);
  }
}

export default NemNodeExplorer;
