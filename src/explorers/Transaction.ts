import { Coin, Token } from 'src/abstract';
import type Explorer from 'src/explorers/explorer';

type TransactionFields = {
  wallet: Coin | Token;
  explorer: Explorer | string;
  txid: string;
  direction: boolean | 'in';
  otherSideAddress: string;
  amount: string;
  memo?: string;
  datetime: Date | string;
  confirmations: number;
  alias?: string;
  ticker: string;
  timestamp?: number;
  recepient?: string;
};

export default class Transaction {
  wallet: Coin | Token;
  explorer: Explorer | string;
  txid: string;
  direction: boolean | 'in';
  otherSideAddress: string;
  amount: string;
  memo?: string;
  datetime: Date;
  confirmations: number;
  alias: string;
  ticker: string;
  timestamp: number;
  date: string;
  time: string;

  constructor(fields: TransactionFields) {
    if (typeof fields !== 'object') {
      throw new TypeError('Transaction: constructor arguments object must be used');
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

    this.alias = fields.alias || 'atomic';
    this.ticker = fields.ticker;
    this.datetime = fields.datetime;
    this.timestamp = fields.timestamp || this.datetime.getTime();
    this.wallet = fields.wallet;
    this.explorer = fields.explorer;
    this.txid = fields.txid;
    this.direction = fields.direction;
    this.otherSideAddress = fields.otherSideAddress;
    this.amount = fields.amount;
    this.memo = fields.memo;
    this.confirmations = fields.confirmations;

    this.date = this.getDate();
    this.time = this.getTime();
  }

  getDateTime(): Date {
    return new Date(Number(`${this.timestamp}`));
  }

  getDate(): string {
    return this.datetime.toDateString().slice(4);
  }

  getTime(): string {
    return this.datetime.toTimeString().slice(0, 5);
  }

  getStatus(): { text: string; color?: string } {
    return this.confirmations > 1 ? { text: 'Confirmed', color: '#06CE91' } : { text: 'Pending' };
  }

  getHash(): string {
    return this.txid;
  }

  static fromHistory(fields: TransactionFields): Transaction {
    const tx = new this(fields);

    tx.direction = fields.direction === 'in';
    tx.datetime = tx.getDateTime();
    tx.otherSideAddress = fields.recepient || '';

    return tx;
  }
}
