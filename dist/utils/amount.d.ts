import BN from 'bn.js';
import type { WalletIdentifierType, WalletId, WalletTicker, WalletDecimal, WalletConfirmation } from '../abstract/index.js';
export default class Amount {
    #private;
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
    constructor(initialAmount: string, { id, ticker, decimal, confirmed }: WalletIdentifierType);
    toCurrency(ticker?: boolean): string;
    toMinimal(ticker?: boolean): string;
    toBN(): BN;
    /**
     * JSON representative
     * for correct `JSON.stringify(<Amount>)` results
     */
    toJSON(): string;
}
