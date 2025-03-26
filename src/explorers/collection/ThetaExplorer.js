import Explorer from 'src/explorers/explorer';
import Transaction from 'src/explorers/Transaction';

const DEFAULT_TX_LIMIT = 20;

export default class ThetaExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.defaultTxLimit = DEFAULT_TX_LIMIT;
  }

  getAllowedTickers() {
    return ['THETA', 'TFUEL'];
  }

  /**
   * Gets the txs
   *
   * @param  {Object} options the request options
   * @return {Object[]} the txs
   * @throws {Error}
   */
  async getTransactions(options) {
    try {
      const txs = await super.getTransactions(options);

      return txs;
    } catch (error) {
      if (error?.errorData?.response?.data?.type === 'error_not_found') {
        return [];
      }

      throw error;
    }
  }

  getTransactionsUrl(address) {
    return `accountTx/${address}`;
  }

  getTransactionsParams(address, offset, limit = this.defaultTxLimit, pageNum = 0) {
    return {
      pageNumber: pageNum + 1,
      limitNumber: limit,
    };
  }

  async modifyTransactionsResponse(response, selfAddress) {
    const txs = response.body;

    if (!Array.isArray(txs)) {
      return [];
    }

    const currentBlock = await this.wallet.getProvider('node').getLatestBlockNumber();

    return txs.flatMap((tx) => this.getTransactionsModifiedResponse(tx, selfAddress, currentBlock));
  }

  getTransactionsModifiedResponse(tx, selfAddress, currentBlock) {
    const lcSelfAddress = selfAddress.toLowerCase();

    const matchedOutput = tx.data.outputs?.find((output) => output.address === lcSelfAddress) || tx.data.outputs?.[0];
    const matchedInput = tx.data.inputs?.find((input) => input.address === lcSelfAddress) || tx.data.inputs?.[0];

    if (
      !matchedOutput?.coins ||
      !matchedInput ||
      ![matchedOutput, matchedInput].some((matched) => matched?.address === lcSelfAddress)
    ) {
      return [];
    }

    const tokens = this.wallet.getTokens();

    return Object.entries(matchedOutput.coins).reduce((txs, [coin, amount]) => {
      const ticker = this.wallet.getProvider('node').getTickerFromProvider(coin);

      const wallet = tokens[ticker] || this.wallet;

      if (new this.wallet.BN(amount).lte(new this.wallet.BN(0))) {
        // supports only theta and thetafuel transactions, doesn't support smart contracts
        return txs;
      }

      const direction = matchedOutput.address === lcSelfAddress;

      return [
        ...txs,
        new Transaction({
          walletid: wallet.id,
          name: wallet.name,
          ticker,
          txid: this.getTxHash(tx),
          direction,
          otherSideAddress: (direction ? matchedInput : matchedOutput).address,
          amount: wallet.toCurrencyUnit(amount),
          datetime: this.getTxDateTime(tx),
          memo: this.getTxMemo(tx),
          nonce: matchedInput.sequence,
          alias: wallet.alias,
          fee: this.getTxFee(tx),
          feeTicker: this.getTxFeeTicker(tx),
          confirmations: this.getTxConfirmations(tx, currentBlock),
        }),
      ];
    }, []);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxConfirmations(tx, currentBlock = 0) {
    return tx.status !== 'pending'
      ? new this.wallet.BN(currentBlock).sub(new this.wallet.BN(tx.block_height)).toString()
      : '0';
  }

  getTxDateTime(tx) {
    return new Date(Number(tx.timestamp) * 1000);
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(
      Object.values(tx.data.fee).find((amount) => new this.wallet.BN(amount).gt(new this.wallet.BN(0))),
    );
  }

  getTxFeeTicker(tx) {
    const { fee } = tx.data;

    const matchedKey = Object.keys(fee).find((key) => new this.wallet.BN(fee[key]).gt(new this.wallet.BN(0)));

    return this.wallet.getProvider('node').getTickerFromProvider(matchedKey);
  }
}
