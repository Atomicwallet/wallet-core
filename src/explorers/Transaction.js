/**
 * Class for the transaction.
 *
 * @class Transaction
 */
class Transaction {
  /**
   * Constructs the transaction.
   *
   * @param {Coin|Token} wallet The wallet
   * @param {Explorer|String} explorer The explorer
   * @param {String} txid The transaction ID (hash)
   * @param {Boolean} direction The direction tStringStringrue=+ false=-
   * @param {String} otherSideAddress The address of opponent
   * @param {String} amount The amount in currency
   * @param {String} memo or payment-id message
   * @param {Date} date The timestamp of transaction
   * @param {Number} confirmations
   */
  constructor(fields) {
    if (typeof fields !== 'object') {
      throw new TypeError('Transaction: constructor arguments object must be used');
    }
    if (arguments.length > 1) {
      throw new Error('Transaction: constructor accepts only 1 argument');
    }
    if (!fields.alias) {
      fields.alias = 'atomic';
    }
    if (!fields.ticker) {
      throw new Error('Transaction: must have ticker');
    }
    if (!fields.datetime) {
      throw new Error('Transaction: must have datetime object');
    }
    if (typeof fields.datetime === 'string') {
      fields.datetime = new Date(fields.datetime);
    }

    for (const [key, value] of Object.entries(fields)) {
      this[key] = value;
    }

    if (!fields.timestamp) {
      this.timestamp = fields.datetime.getTime();
    }
    this.date = this.getDate();
    this.time = this.getTime();
  }

  /**
   * Gets the transaction datetime.
   *
   * @return {Date} The transaction datetime.
   */
  getDateTime() {
    return new Date(Number(`${this.timestamp}`));
  }

  /**
   * Gets the transaction date.
   *
   * @return {String} The transaction date.
   */
  getDate() {
    return this.datetime.toDateString().slice(4);
  }

  /**
   * Gets the transaction time.
   *
   * @return {String} The transaction time.
   */
  getTime() {
    return this.datetime.toTimeString().slice(0, 5);
  }

  /**
   * Gets the status.
   *
   * @return {Object} The status.
   */
  getStatus() {
    return this.confirmations > 1 ? { text: 'Confirmed', color: '#06CE91' } : { text: 'Pending' };
  }

  /**
   * Gets the transaction hash.
   *
   * @return {String} The transaction hash.
   */
  getHash() {
    return this.txid;
  }

  static fromHistory(fields) {
    const tx = new this(fields);

    tx.direction = fields.direction === 'in';
    tx.datetime = tx.getDateTime();
    tx.otherSideAddress = fields.recepient;

    return tx;
  }
}

export default Transaction;
