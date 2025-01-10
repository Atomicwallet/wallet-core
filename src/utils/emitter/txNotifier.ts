import eventEmitter from './emitter';
import type { Coin, Token } from '@/abstract';

const MESSAGE_TYPES = ['reward', 'unfreeze', 'freeze', 'vote'];

class TxNotifier {
  private wallet: Coin | Token;
  private eventEmitter: typeof eventEmitter;

  constructor(wallet: Coin | Token) {
    this.eventEmitter = eventEmitter;
    this.wallet = wallet;
  }

  notify(type: string, tx: unknown, walletId: string, ticker: string, hash: string): void {
    if (type === 'receive') {
      this.eventEmitter.emit(`${this.wallet.ticker}-${walletId}::new-socket-tx`, {
        unconfirmedTx: tx,
      });
    }

    if (type === 'confirm') {
      this.eventEmitter.emit(`${this.wallet.ticker}::confirmed-socket-tx`, walletId, tx, ticker, hash);
    }

    MESSAGE_TYPES.forEach((message) => {
      if (type === message) {
        this.eventEmitter.emit(`${this.wallet.ticker}::confirmed-${type}`, tx || {});
      }
    });
  }
}

export default TxNotifier;
