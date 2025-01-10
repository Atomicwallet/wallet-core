// import history from '../../History'

const MESSAGE_TYPES = ['reward', 'unfreeze', 'freeze', 'vote'];

const HasBlockscannerMixin = (superclass) =>
  class extends superclass {
    async getSocketTransaction({ address, hash, tokens, type, scriptPubKey }) {
      const newTx = await this.getTransaction(address, hash, tokens);

      // await history.filterAndUpdateTransactions([newTx])

      if (type === 'receive') {
        this.eventEmitter.emit(`${this.wallet.parent}-${newTx.walletid}::new-socket-tx`, {
          unconfirmedTx: newTx,
        });
      }

      if (type === 'confirm') {
        this.eventEmitter.emit(`${this.wallet.parent}::confirmed-socket-tx`, newTx.walletid, newTx, newTx.ticker);
      }

      MESSAGE_TYPES.forEach((message) => {
        if (type === message) {
          this.eventEmitter.emit(`${this.wallet.parent}::confirmed-${type}`, newTx || {});
        }
      });
    }
  };

export default HasBlockscannerMixin;
