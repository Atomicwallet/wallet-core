import eventEmitter from './emitter.js';
const MESSAGE_TYPES = ['reward', 'unfreeze', 'freeze', 'vote'];
export default class TxNotifier {
    constructor(wallet) {
        this.eventEmitter = eventEmitter;
        this.wallet = wallet;
    }
    notify(type, tx, walletId, ticker, hash) {
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
//# sourceMappingURL=txNotifier.js.map