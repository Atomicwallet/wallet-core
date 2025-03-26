const HasBlockScanner = (superclass) =>
  class extends superclass {
    /**
     * Notifies the client on tx received from socket
     *
     * @param {Object} tx the tx data
     */
    onConfirmSocketTx(tx) {
      this.getInfo();

      if (tx?.direction) {
        this.eventEmitter.emit('socket::newtx', {
          id: this.id,
          ticker: this.ticker,
          amount: tx.amount,
          txid: tx.txid,
        });
      } else {
        this.eventEmitter.emit('socket::newtx::outgoing', {
          id: this.id,
          ticker: this.ticker,
        });
      }
    }
  };

export default HasBlockScanner;
