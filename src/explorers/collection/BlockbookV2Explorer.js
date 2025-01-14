import Explorer from 'src/explorers/explorer';
import Transaction from 'src/explorers/Transaction';
import { getTokenId } from 'src/utils';
import { GET_TRANSACTION_TYPE, GET_TRANSACTIONS_TYPE, ONE_MINUTE } from 'src/utils/const';
import { toCurrency } from 'src/utils/convert';

const EXPLORER_VERSION = 2;

class BlockbookV2Explorer extends Explorer {
  constructor(...args) {
    super(...args);
    this.version = EXPLORER_VERSION;
    this.canPaginate = true;
  }

  async getSocketTransaction({ address, hash, scriptPubKey }) {
    const unconfirmedTx = await this.getTransaction(address, hash);

    const utxos = await this.getUnspentOutputs(address, scriptPubKey);
    const unconfirmedBalance = this.calculateBalance(utxos).toString();

    // TODO implement history data storage

    this.eventEmitter.emit(`${this.wallet.parent}-${this.wallet.id}::new-socket-tx`, {
      unconfirmedTx,
      unconfirmedBalance,
    });
  }

  getAllowedTickers() {
    return [
      'BTC',
      'BSC',
      'BCD',
      'BTG',
      'BCH',
      'BSV',
      'DOGE',
      'LTC',
      'DGB',
      'DASH',
      'RVN',
      'KMD',
      'ETH',
      'DCR',
      'QTUM',
      'ZEC',
      'YEC',
      'GRS',
    ];
  }

  getNnTickers() {
    return ['DOGE', 'ZEC'];
  }

  getApiPrefix() {
    return `api/v${this.version}/`;
  }

  getLatestBlockUrl() {
    return `${this.getApiPrefix()}block-index/last`;
  }

  getBlockUrl(hash) {
    return `${this.getApiPrefix()}block/${hash}`;
  }

  getBlockMethod() {
    return 'get';
  }

  getBlockParams() {
    return {};
  }

  getBlockOptions() {
    return {};
  }

  getAddressUrl(address) {
    return `${this.getApiPrefix()}address/${address}`;
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}address/${address}`;
  }

  getInfoOptions() {
    return this.config.options || {};
  }

  getUserTokenListParams() {
    return {};
  }

  getTransactionsOptions() {
    return this.wallet.ticker === 'BSC' ? { headers: { 'api-key': 'ypa5Llv3B3fyToNsMkkaiEIIGKdcRYqU' } } : {};
  }

  getInfoParams() {
    return this.config.options || {};
  }

  /**
   * Gets the send request options
   *
   * @returns {Object}
   */
  getSendOptions() {
    if (this.wallet.ticker === 'BSV') {
      return { headers: { 'Content-Type': 'text/plain' } };
    }
    if (this.getNnTickers().includes(this.wallet.ticker)) {
      return { headers: { 'Content-Type': 'application/json' } };
    }
    return {};
  }

  modifyInfoResponse(response) {
    const unconfirmedBalance = new this.wallet.BN(response.unconfirmedBalance);
    const confirmedBalance = new this.wallet.BN(response.balance);

    const actualBalance = confirmedBalance.add(unconfirmedBalance).toString();

    const tokenBalances = {};

    if (response.tokens) {
      response.tokens.forEach((token) => {
        tokenBalances[token.symbol] = token.balance;
      });
    }

    return {
      balance: actualBalance,
      tokenBalances,
      unconfirmedBalance: unconfirmedBalance.toString(),
      transactions: [],
    };
  }

  getTransactionUrl(txId) {
    return `${this.getApiPrefix()}tx/${txId}`;
  }

  getTransactionParams() {
    return this.getInfoParams();
  }

  getTransactionsUrl(address) {
    return `${this.getApiPrefix()}address/${address}`;
  }

  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit, pageNum) {
    const options = this.getInfoParams();

    return {
      ...options,
      page: pageNum,
      pageSize: limit,
      details: 'txs',
      filter: 'All',
    };
  }

  /**
   * Get specific smart-contract transactions for a wallet
   *
   * @return {Promise<Object[]>}
   */
  async getTokenTransactions({ address, offset, limit, pageNum, contract }) {
    if (
      this.defaultRequestTimeout &&
      Date.now() - this.defaultRequestTimeout * ONE_MINUTE < this.lastGetTxsRequestTime
    ) {
      return [];
    }

    if (
      this.defaultRequestTimeout &&
      Date.now() - this.defaultRequestTimeout * ONE_MINUTE > this.lastGetTxsRequestTime
    ) {
      this.lastGetTxsRequestTime = Date.now();
    }

    try {
      const response = await this.request(
        this.getTransactionsUrl(address, offset || 0, limit || this.defaultTxLimit, pageNum),
        this.getTransactionsMethod(),
        this.getTokenTransactionsParams(address, offset || 0, limit || this.defaultTxLimit, pageNum, contract),
        GET_TRANSACTIONS_TYPE,
        this.getTransactionsOptions(),
      );

      return this.modifyTokenTransactionsResponse(response?.transactions || [], address);
    } catch {
      return [];
    }
  }

  getTokenTransactionsParams(address, offset, limit, pageNum, contract) {
    const params = this.getTransactionsParams(address, offset, limit, pageNum);

    return { ...params, contract };
  }

  modifyTransactionResponse(response, address) {
    if (response.tokenTransfers && Number(response.value) === 0) {
      const tokenTransactions = {};

      response.tokenTransfers.forEach((transfer) => {
        /* some tokens could have empty symbol/ticker
         * (service tokens / spam / etc)
         * e.g. Matic staking will mint empty symbol tokens
         *
         * those transfers should be ignored
         */
        if (!transfer.symbol) {
          return;
        }

        if (!tokenTransactions[transfer.token]) {
          tokenTransactions[transfer.token] = [];
        }

        tokenTransactions[transfer.token].push(
          this.getTransactionFromTokenTransfer({
            transfer,
            selfAddress: address,
            tx: response,
          }),
        );
      });

      for (const contract in tokenTransactions) {
        const transactions = tokenTransactions[contract];

        // there is no guarantee about single contract transfer inside,
        // but anyway we are expecting only one to keep explorers API as-is
        if (transactions.length !== 0) {
          for (const transaction of transactions) {
            const { otherSideAddress } = transaction;

            if ([otherSideAddress.toLowerCase(), address.toLowerCase()].includes(address.toLowerCase())) {
              return transaction;
            }
          }
        }
      }
    }

    return super.modifyTransactionResponse(response, address);
  }

  modifyTransactionsResponse(response, selfAddress) {
    const condition = response && !!response.transactions;

    const transfers = condition
      ? response.transactions.filter(
          (tx) => tx.tokenTransfers && Array.isArray(tx.tokenTransfers) && Number(tx.value) === 0,
        )
      : [];
    const transactions = condition
      ? response.transactions.filter(
          (tx) =>
            (!tx.tokenTransfers || Number(tx.value) !== 0) &&
            !(tx.ethereumSpecific && tx.ethereumSpecific.status === 0),
        )
      : [];
    const failed = condition
      ? response.transactions.filter((tx) => tx.ethereumSpecific && tx.ethereumSpecific.status === 0)
      : [];

    const txs = super.modifyTransactionsResponse(transactions, selfAddress);

    if (transfers.length > 0) {
      return {
        transactions: txs,
        failed,
        tokenTransactions: this.modifyTokenTransactionsResponse(transfers, selfAddress),
      };
    }

    if (['ETH', 'BSC'].includes(this.wallet.parent)) {
      return { transactions: txs, failed };
    }

    return txs;
  }

  modifyTokenTransactionsResponse(response, selfAddress) {
    return (
      response
        ?.map((tx) => {
          return tx.tokenTransfers
            ?.filter((transfer) => this.filterTokenTransferTransactions(selfAddress, transfer))
            .map((transfer) =>
              this.getTransactionFromTokenTransfer({
                transfer,
                selfAddress,
                tx,
              }),
            );
        })
        .flat() ?? []
    );
  }

  filterTokenTransferTransactions(selfAddress, transfer) {
    if (
      ![transfer.to.toLowerCase(), transfer.from.toLowerCase()].includes(selfAddress.toLowerCase()) ||
      !transfer.symbol
    ) {
      return false;
    }
    return true;
  }

  getTransactionFromTokenTransfer({ transfer, selfAddress, tx }) {
    return new Transaction({
      ticker: transfer.symbol.toUpperCase(),
      txid: this.getTxHash(tx),
      walletid: getTokenId({
        ticker: transfer.symbol,
        contract: transfer.token ?? transfer.contract,
        parent: this.wallet.id,
      }),
      fee: this.getTxFee(tx),
      feeTicker: this.wallet.parent,
      direction: transfer.to.toLowerCase() === selfAddress.toLowerCase(),
      otherSideAddress:
        transfer.to.toLowerCase() === selfAddress.toLowerCase()
          ? transfer.from.toLowerCase()
          : transfer.to.toLowerCase(),
      amount: toCurrency(transfer.value, transfer.decimals),
      datetime: this.getTxDateTime(tx),
      memo: this.getTxMemo(tx),
      confirmations: this.getTxConfirmations(tx),
      nonce: this.getTxNonce(tx),
      alias: this.wallet.alias,
    });
  }

  getUnspentOutputsUrl(address) {
    return `${this.getApiPrefix()}utxo/${address}`;
  }

  getUnspentOutputsParams(address) {
    return this.getInfoParams();
  }

  modifyUnspentOutputsResponse(address, response, scriptPubKey) {
    if (!scriptPubKey) {
      throw this.createError('No scriptPubKey');
    }

    return response.map(({ txid, vout, value, height }) => ({
      txid,
      txId: txid, // DGB
      vout,
      script: scriptPubKey,
      value,
      address,
      outputIndex: vout, // BTC
      satoshis: Number(value),
      height,
    }));
  }

  getSendTransactionUrl() {
    return `${this.getApiPrefix()}sendtx/`;
  }

  getSendTransactionParams(rawtx) {
    if (this.getNnTickers().includes(this.wallet.ticker)) {
      return JSON.stringify(rawtx);
    }

    return rawtx;
  }

  modifySendTransactionResponse(response) {
    return {
      txid: response.result,
    };
  }

  /**
   * Gets the transaction datetime.
   *
   * @param {Object} tx The transaction response
   * @return {Date} The transaction datetime.
   */
  getTxDateTime(tx) {
    return tx.blockTime ? new Date(Number(`${tx.blockTime}000`)) : new Date();
  }

  /**
   * Gets the transaction amount.
   *
   * @param {Object} tx The transaction
   * @return {String} The transaction amount.
   */
  getTxValue(selfAddress, tx) {
    let valueIn = new this.wallet.BN(0);
    let valueOut = new this.wallet.BN(0);

    if (!tx.vin || !tx.vout) {
      return '0';
    }

    if (['ETH', 'BSC'].includes(this.wallet.ticker)) {
      tx.vout.forEach((output) => {
        if (Array.isArray(output.addresses) && output.addresses.length > 0) {
          valueOut = valueOut.add(new this.wallet.BN(output.value));
        }
      });

      return this.wallet.toCurrencyUnit(valueOut);
    }

    const fees = new this.wallet.BN(tx.fees);
    let insOuts = [];

    tx.vin.forEach((input) => {
      if (Array.isArray(input.addresses)) {
        insOuts = insOuts.concat(input.addresses);

        if (input.addresses.includes(selfAddress)) {
          valueIn = valueIn.add(new this.wallet.BN(input.value));
        }
      }
    });

    tx.vout.forEach((output) => {
      if (Array.isArray(output.addresses)) {
        insOuts = insOuts.concat(output.addresses);

        if (output.addresses.includes(selfAddress)) {
          valueOut = valueOut.add(new this.wallet.BN(output.value));
        }
      }
    });

    const sentToSelf = insOuts.every((inOut) => inOut === selfAddress);
    const decimal = this.wallet.decimal;

    if (sentToSelf) {
      if (this.wallet.ticker === 'KMD') {
        const txValue = valueOut.sub(valueIn);

        if (txValue.gten(0)) {
          return toCurrency(txValue, decimal);
        }
      }
      return toCurrency(tx.fees, decimal);
    }

    const txDirection = this.getTxDirection(selfAddress, tx);
    const txValue = txDirection ? valueOut : valueIn.sub(valueOut).sub(fees);

    return toCurrency(txValue, decimal);
  }

  getTxNonce(tx) {
    if (tx.ethereumSpecific) {
      return tx.ethereumSpecific.nonce;
    }

    return undefined;
  }

  /**
   * Gets the transaction direction.
   *
   * @param {Object} tx The transaction
   * @return {Boolean} The transaction direction.
   */
  getTxDirection(selfAddress, tx) {
    if (['ETH', 'BSC'].includes(this.wallet.ticker)) {
      return tx.vout[0].addresses && tx.vout[0].addresses[0].toLowerCase() === selfAddress.toLowerCase();
    }

    const hasIn =
      tx.vin &&
      tx.vin
        .filter(({ addresses }) => Array.isArray(addresses))
        .some(({ addresses }) => addresses.some((address) => address === selfAddress));

    const hasOut =
      tx.vout &&
      tx.vout
        .filter(({ addresses }) => Array.isArray(addresses))
        .some(({ addresses }) => addresses.some((address) => address === selfAddress));

    const hasOtherOut =
      tx.vout &&
      tx.vout
        .filter(({ addresses }) => Array.isArray(addresses))
        .some(({ addresses }) => addresses.some((address) => address !== selfAddress));

    if (hasOut && !hasIn) {
      return true;
    }
    if (hasIn && hasOut && !hasOtherOut && this.wallet.ticker === 'KMD') {
      // looks like sent to self - may be claim
      return true;
    }

    return false; // sent to self or outgoing
  }

  /**
   * Gets the transaction recipient.
   *
   * @param {Object} tx The transaction response.
   * @return {(Boolean|String)} The transaction recipient.
   */
  getTxOtherSideAddress(selfAddress, tx) {
    if (!selfAddress) {
      throw new Error('selfAddress is not defined');
    }
    const isIncoming = this.getTxDirection(selfAddress, tx);

    if (['ETH', 'BSC'].includes(this.wallet.ticker)) {
      return isIncoming ? tx.vin[0].addresses[0] : (tx.vout[0].addresses && tx.vout[0].addresses[0]) || selfAddress;
    }

    if (!tx.vin) {
      return '...';
    }

    let outputAddresses = [];
    let inputAddresses = [];

    tx.vout.forEach((out) => {
      outputAddresses = outputAddresses.concat(out.addresses);
    });

    tx.vin.forEach((input) => {
      inputAddresses = inputAddresses.concat(input.addresses);
    });

    if (isIncoming) {
      const hasOtherIn =
        tx.vin &&
        tx.vin
          .filter(({ addresses }) => Array.isArray(addresses))
          .some(({ addresses }) => addresses.some((address) => address !== selfAddress));

      if (!hasOtherIn) {
        // kmd claim
        return 'Claim';
      }
      return inputAddresses.find((inputAddress) => {
        return inputAddress !== selfAddress;
      });
    }

    const myAddressCount = outputAddresses.reduce((acc, curAddr) => {
      return curAddr === selfAddress ? acc + 1 : acc;
    }, 0);

    if (myAddressCount === outputAddresses.length) {
      return selfAddress;
    }

    const otherSide = outputAddresses.find((address) => {
      return address !== selfAddress;
    });

    return otherSide;
  }

  /**
   * Calculates the balance.
   *
   * @param {Object[]} utxos The utxos
   * @return {BN} The balance.
   */
  calculateBalance(utxos = []) {
    return utxos.reduce((acc, { value }) => new this.wallet.BN(value).add(acc), new this.wallet.BN('0'));
  }

  /**
   * Returns user token list data
   * @param {String} address
   * @returns {Array}
   */
  getUserTokenList(address) {
    return this.request(
      this.getInfoUrl(address),
      'get',
      this.getUserTokenListParams(),
      '',
      this.getTransactionsOptions(),
    ).then((data) =>
      data.tokens.map((token) => ({
        contractAddress: token.contract,
        decimals: 0,
        ...token,
      })),
    );
  }

  async getBannedTokensList() {
    // @TODO implement fetch banned tokens list
    return [];
  }

  // only for ETH
  async getNonce(address) {
    const info = await this.request(this.getInfoUrl(address));

    return info.nonce;
  }

  getTokensInfo() {
    return 0;
  }

  getTokenBalanceByContractAddress({ info, tokenTicker }) {
    if (info === 'undefined' && info.tokenBalances === 'undefined') {
      throw new Error('BlockbookV2Explorer: getTokenBalanceByContractAddress error: info.tokenBalances must be object');
      /* eslint-disable no-unreachable */
      return 0;
      /* eslint-enable */
    }
    return info.tokenBalances[tokenTicker];
  }

  async getTransactionUnmodified(txId) {
    return this.request(
      this.getTransactionUrl(txId),
      this.getTransactionMethod(),
      this.getTransactionParams(txId),
      GET_TRANSACTION_TYPE,
      this.getTransactionOptions(),
    );
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit((tx && tx.fees) || 0);
  }
}

export default BlockbookV2Explorer;
