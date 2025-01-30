import type { Coin, Token } from '../../abstract/index.js';
export default class TxNotifier {
    private wallet;
    private eventEmitter;
    constructor(wallet: Coin | Token);
    notify(type: string, tx: unknown, walletId: string, ticker: string, hash: string): void;
}
