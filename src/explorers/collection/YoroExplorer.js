import { ExplorerRequestError } from '../../errors/index.js';
import {
  SEND_TRANSACTION_TYPE,
  GET_UTXO_TYPE,
  GET_BALANCE_TYPE,
} from '../../utils/const';
import Explorer from '../Explorer';

class YoroExplorer extends Explorer {
  constructor(...args) {
    super(...args);
    this.lastTx = undefined;
    this.updating = false;
    this.txs = [];
    this.lastDelegationCert = null;
  }

  getAllowedTickers() {
    return ['ADA'];
  }

  async getInfo(address) {
    const balance = await this.getBalance(address);

    return {
      balance,
      transactions: this.wallet.transactions,
    };
  }

  /**
   * Get a transactions list for a wallet
   *
   * @return {Promise<Object[]>}
   */
  async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
    const { hash = null } = await this.getLatestBlock();

    if (!hash) {
      return this.txs;
    }

    const txs = await this.getTransactionsQueued({ blockHash: hash, address });

    // TODO remove crutch which helps from get transactions duplicating
    return txs

      .filter(
        (
          (tx) =>
          ({ txid }) =>
            !tx.has(txid) && tx.add(txid)
        )(new Set()),
      )

      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async getTransactionsQueued({
    blockHash,
    address,
    recursion = false,
    after = undefined,
  }) {
    if (this.updating && !recursion) {
      return this.txs;
    }
    if (!this.updating && !recursion) {
      this.txs = [];
    }

    if (this.lastTx) {
      const afterParams = {
        tx: this.lastTx.hash,
        block: this.lastTx.block_hash,
      };

      after = after || afterParams;
    }

    this.updating = true;
    const untilBlock = String(blockHash);

    const response = await this.request(
      this.getTransactionsUrl(address),
      this.getTransactionsMethod(),
      this.getTransactionsParams(address, untilBlock, after),
      'GetTxs',
      this.getInfoOptions(),
    ).catch(() => {
      this.updating = false;
    });

    if (!response) {
      this.updating = false;
      return this.txs;
    }

    const txs = this.modifyTransactionsResponse(response, address);

    this.txs.push(...txs);

    if (response.length > 0) {
      const lastTx = response[response.length - 1];

      if (lastTx.certificates.length > 0) {
        lastTx.certificates.forEach((cert) => {
          if (cert.kind === 'StakeDelegation') {
            this.lastDelegationCert = cert;
          }
        });
      }

      const afterParams = {
        tx: lastTx.hash,
        block: lastTx.block_hash,
      };

      this.lastTx = lastTx;

      const resolved = await this.getTransactionsQueued({
        blockHash: untilBlock,
        address,
        recursion: true,
        after: afterParams,
      });

      return resolved;
    }

    this.lastUpdatedTx = false;
    this.updating = false;
    return this.txs;
  }

  getLatestBlockUrl() {
    return '/api/v2/bestblock';
  }

  getTransactionsUrl(address) {
    return '/api/v2/txs/history';
  }

  getUnspentOutputsUrl() {
    return '/api/txs/utxoForAddresses';
  }

  getUTXOUrl() {
    return '/api/txs/utxoForAddresses';
  }

  getRegistrationHistoryUrl() {
    return '/api/getRegistrationHistory';
  }

  getTxUrl(txId) {
    return `/api/txs/summary/${txId}`;
  }

  getAccountStateUrl() {
    return '/api/getAccountState';
  }

  getInfoOptions() {
    return {
      headers: {
        'tangata-manu': 'atomic',
      },
    };
  }

  getBroadcastUrl() {
    return this.config.submitUrl || 'api/txs/signed';
  }

  getTransactionsMethod() {
    return 'post';
  }

  getTransactionsParams(address, untilBlock, after = undefined) {
    return {
      addresses: [address],
      untilBlock,
      after,
    };
  }

  modifyTransactionsResponse(txs, address) {
    return super.modifyTransactionsResponse(txs.reverse(), address);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(selfAddress, tx) {
    return !tx.inputs.find((input) => selfAddress === input.address);
  }

  getTxOtherSideAddress(selfAddress, tx) {
    const income = this.getTxDirection(selfAddress, tx);

    if (income) {
      const inp = tx.inputs.find((input) => selfAddress !== input.address);

      return inp.address;
    }

    const out = tx.outputs.find((output) => selfAddress !== output.address);

    if (!out) {
      return selfAddress;
    }

    return out.address;
  }

  getTxValue(selfAddress, tx) {
    const isIncoming = this.getTxDirection(selfAddress, tx);
    const indexes = [];

    tx.outputs.forEach((output, idx) => {
      if (isIncoming && output.address === selfAddress) {
        indexes.push(idx);
      } else if (!isIncoming && output.address !== selfAddress) {
        indexes.push(idx);
      }
    });

    const inputsAddress = tx.inputs.map((input) => input.address);
    const outputsAddress = tx.outputs.map((output) => output.address);

    const sentToMyself = inputsAddress
      .concat(outputsAddress)
      .every((address) => address === selfAddress);

    let value;

    if (sentToMyself) {
      const outputsAmount = tx.outputs.reduce(
        (prev, cur) => prev.add(new this.wallet.BN(cur.amount)),
        new this.wallet.BN(0),
      );

      const inputsAmount = tx.inputs.reduce(
        (prev, cur) => prev.add(new this.wallet.BN(cur.amount)),
        new this.wallet.BN(0),
      );

      value = inputsAmount.sub(outputsAmount).toString();
    } else {
      value = indexes
        .reduce(
          (acc, cur) => acc.add(new this.wallet.BN(tx.outputs[cur].amount)),
          new this.wallet.BN(0),
        )
        .toString();
    }

    return this.wallet.toCurrencyUnit(value);
  }

  getTxDateTime(tx) {
    return new Date(tx.time);
  }

  getTxConfirmations(tx) {
    return Number(tx.best_block_num) - Number(tx.block_num);
  }

  /**
   * Gets the balance
   *
   * @returns {Promise<BN>}
   */
  async getBalance(address) {
    const utxo = await this.getUTXO(address).catch((error) => {
      throw new ExplorerRequestError({
        type: GET_BALANCE_TYPE,
        error,
        url: this.getUTXOUrl(),
        instance: this,
      });
    });

    const balance = utxo.reduce(
      (value, { amount }) => value.add(new this.wallet.BN(amount)),
      new this.wallet.BN(0),
    );

    return balance.toString();
  }

  async getUnspentOutputs(address) {
    return this.getUTXO(address);
  }

  /**
   * @param {string} address
   * @returns {Promise<Object[]>}
   */
  async getUTXO(address) {
    const result = await this.request(
      this.getUTXOUrl(),
      'post',
      { addresses: [address] },
      undefined,
      this.getInfoOptions(),
    ).catch((error) => {
      throw new ExplorerRequestError({
        type: GET_UTXO_TYPE,
        error,
        url: this.getUTXOUrl(),
        instance: this,
      });
    });

    return result;
  }

  /**
   * @param {object} transaction
   * @returns {Promise<string>}
   */
  async sendTransaction({ rawtx, txid }) {
    const tx = Buffer.from(rawtx);
    const base64tx = tx.toString('base64');
    const response = await this.request(
      this.getBroadcastUrl(),
      'post',
      {
        signedTx: base64tx,
      },
      undefined,
      this.getInfoOptions(),
    ).catch((error) => {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error,
        url: this.getBroadcastUrl(),
        instance: this,
      });
    });

    if (!response) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error:
          "ADA: sendTransaction: response.data doesn't have Right property",
        url: this.getBroadcastUrl(),
        instance: this,
      });
    }

    return { txid };
  }

  async getTxSummary(txId) {
    return this.request(
      this.getTxUrl(txId),
      'get',
      {},
      undefined,
      this.getInfoOptions(),
    );
  }

  async getTxsSummary(txsIds /* Array<txId:string> */) {
    const summary = [];

    for (const txId of txsIds) {
      const res = await this.getTxSummary(txId);

      summary.push(res);
    }

    return summary;
  }

  async getRegistrationHistory(stakeAddressHex) {
    return this.request(
      this.getRegistrationHistoryUrl(),
      'post',
      {
        addresses: [stakeAddressHex],
      },
      undefined,
      this.getInfoOptions(),
    );
  }

  async getAccountState(stakeAddressHex) {
    return this.request(
      this.getAccountStateUrl(),
      'post',
      {
        addresses: [stakeAddressHex],
      },
      undefined,
      this.getInfoOptions(),
    );
  }
}

export default YoroExplorer;
