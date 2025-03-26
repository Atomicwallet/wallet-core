import BigNumber from 'bignumber.js'; // BN.js does not support floating points operations
import BN from 'bn.js';
import type { WalletIdentifierType, WalletId, WalletTicker, WalletDecimal, WalletConfirmation } from 'src/abstract';
import { toCurrency } from 'src/utils/convert';

const min = new BigNumber('0.01');
const dust = new BigNumber('0.000001');

export default class Amount {
  amount: BN;
  ticker: WalletTicker;
  id: WalletId;
  decimal: WalletDecimal;
  confirmed: WalletConfirmation;

  /**
   *
   * @param {string} initialAmount minimal units
   * @param {string} id coin/token id
   * @param {string} ticker
   * @param {number} decimal
   */
  constructor(initialAmount: string, { id, ticker, decimal, confirmed = true }: WalletIdentifierType) {
    if (!initialAmount || !ticker || !decimal || !id) {
      throw new Error('Initial values should be defined: `amount`, `id`, `ticker`, `decimal`');
    }

    if (initialAmount.toString().includes('.')) {
      throw new TypeError('Amount should be passed in minimal units');
    }

    if (!Number.isInteger(decimal)) {
      throw new TypeError('Decimal should be integer');
    }

    this.amount = new BN(initialAmount);
    this.ticker = ticker;
    this.id = id;
    this.decimal = decimal;
    this.confirmed = confirmed;
  }

  toCurrency(ticker = false): string {
    const currency: string = toCurrency(this.amount, this.decimal);

    return ticker ? `${currency} ${this.ticker}` : currency;
  }

  toMinimal(ticker = false): string {
    const minimal: string = this.amount.toString();

    return ticker ? `${minimal} ${this.ticker}` : minimal;
  }

  toBN(): BN {
    return this.amount;
  }

  /**
   * JSON representative
   * for correct `JSON.stringify(<Amount>)` results
   */
  toJSON(): string {
    return this.toMinimal();
  }

  /* @TODO
       Defined math methods like add, mul, div, eq, gt, lt and others
  *    which should mutate inner `this.amount` state
  *  */

  #formatFiat(amountString: string): string {
    const bn = new BigNumber(amountString);

    if (bn.gte(dust) && bn.lt(min)) {
      return bn.toFormat(6);
    }

    return bn.toFormat(2);
  }

  toFiat(
    fiatTicker: string,
    Rates: { getRate: (args: Record<string, string | boolean>, fiatTicker: string) => Record<string, string | number> },
    withTicker = false,
  ): string {
    if (!fiatTicker) {
      throw new Error(`${this.ticker}: Fiat ticker should be defined`);
    }

    if (!Rates) {
      throw new Error(`'Rates && Rates.getRate' should be passed`);
    }

    const { rate } = Rates.getRate({ id: this.id, confirmed: this.confirmed }, fiatTicker) || {};

    if (!rate) {
      throw new Error(`${this.ticker}: Fiat rate for ${fiatTicker} is not exist yet`);
    }

    const fiatAmount: string = new BigNumber(toCurrency(this.amount, this.decimal)).multipliedBy(rate).toFormat();

    return `${this.#formatFiat(fiatAmount)} ${withTicker ? fiatTicker : ''}`.trim();
  }
}
