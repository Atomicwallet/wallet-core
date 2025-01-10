import ReconnectingWebSocket from 'reconnecting-websocket';

import TOKENS_CACHE from '../../resources/binance/tokens.json';
import Explorer from '../Explorer';
import Transaction from '../Transaction';
// import history from '../History'

const WEBSOCKET_CONFIG = {
  WebSocket: global.WebSocket,
  connectionTimeout: 2000,
  maxReconnectionDelay: 20000,
  minReconnectionDelay: 10000,
  maxRetries: 10,
};

// https://testnet-dex.binance.org/api/v1/fees

/**
 * Binance Explorer
 *
 * @abstract
 * @class {Explorer}
 */
class BinanceDex extends Explorer {
  constructor(...args) {
    super(...args);
    this.socket = null;
  }

  getAllowedTickers() {
    return ['BNB'];
  }

  getTransactionUrl(txid) {
    return `${this.config.baseUrl}api/v1/tx/${txid}`;
  }

  getTransactionParams() {
    return {
      format: 'json',
    };
  }

  getLatestBlockUrl() {
    return `${this.config.baseUrl}api/v1/node-info`;
  }

  getBlockUrl(height) {
    return `${this.config.baseUrl}api/v2/transactions-in-block/${height}`;
  }

  async getBlock(heigh) {
    const block = await this.request(this.getBlockUrl(heigh));

    return block;
  }

  async getTransactions(address, asset = 'BNB') {
    const { tx } = await this.request(`${this.config.baseUrl}api/v1/transactions?address=${address}`);

    return this.modifyTransactionsResponse(
      tx.filter((item) => item.type === 'TRANSFER').filter((item) => item.txAsset === asset),
      address,
    );
  }

  async getMultisendTransactions(selfAddress, txs) {
    this.latestBlock = await this.getLatestBlock();

    const modifiedMultisendTxs = await Promise.all(
      txs.map(async ({ hash, height }) => {
        const block = await this.getBlock(height).catch((error) => console.warn('GetBlockError', error));

        if (!block) {
          return undefined;
        }

        const { subTransactions = [], memo, timeStamp } = block.tx.find((transaction) => transaction.txHash === hash);

        const selfTx = subTransactions.find((subTx) => [subTx.toAddr, subTx.fromAddr].includes(selfAddress));

        if (!selfTx) {
          return undefined;
        }

        const fromAddr = selfTx.fromAddr;
        const toAddr = selfTx.toAddr;
        const value = selfTx.value;
        const ticker = selfTx.txAsset;
        const confirmations = Number(this.latestBlock) - Number(height);

        return this.modifyMultisendTransactionResponse(
          {
            ticker,
            value,
            memo,
            fromAddr,
            toAddr,
            hash,
            timeStamp,
            confirmations,
          },
          selfAddress,
        );
      }),
    );

    return modifiedMultisendTxs.filter(Boolean);
  }

  async modifyMultisendTransactionResponse(tx, selfAddress) {
    return new Transaction({
      ticker: tx.ticker,
      name: this.wallet.name,
      alias: this.wallet.alias,
      explorer: this.constructor.name,
      txid: this.getTxHash(tx),
      fee: this.getTxFee(tx),
      feeTicker: this.wallet.parent,
      direction: this.getTxDirection(selfAddress, tx),
      otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
      amount: this.getTxValue(selfAddress, tx),
      datetime: this.getTxDateTime(tx),
      memo: this.getTxMemo(tx),
      confirmations: this.getTxConfirmations(tx),
    });
  }

  modifyLatestBlockResponse(response) {
    return response.sync_info.latest_block_height;
  }

  getTxHash(tx) {
    return tx.hash || tx.txHash;
  }

  getTxDirection(selfAddress, tx) {
    return tx.toAddr === selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.fromAddr : tx.toAddr;
  }

  getTxValue(selfAddress, tx) {
    return tx.value.replace(/(\.\d*[1-9])0+$|\.0*$/, '$1');
  }

  getTxDateTime(tx) {
    return new Date(tx.timeStamp);
  }

  getTxMemo(tx) {
    return tx.memo;
  }

  getTxConfirmations(tx) {
    return tx.confirmations || tx.txAge;
  }

  async getTokenList(userTokenSymbols = []) {
    const tokens = await this.request(`${this.config.baseUrl}api/v1/tokens?limit=1000`).catch(() => TOKENS_CACHE);

    return tokens.filter((token) => userTokenSymbols.includes(token.symbol));
  }

  setSocketClient(address) {
    if (!this.socket) {
      this.socket = new ReconnectingWebSocket(`${this.config.websocketUrl}${address}`, undefined, WEBSOCKET_CONFIG);
    } else {
      this.socket.reconnect();
    }
  }

  disconnectSocket() {
    this.socket.close();
  }

  async connectSocket(address) {
    this.setSocketClient(address);

    if (this.socket._listeners.message.length > 0) {
      console.warn('[BNB][websocket] already have message listener, skip');
      return;
    }

    this.socket.addEventListener('message', async (msg) => {
      try {
        const msgData = JSON.parse(msg.data);

        if (msgData.stream === 'accounts') {
          this.wallet.updateBalances(msgData.data.B);
        }

        if (msgData.stream === 'transfers') {
          const txData = msgData.data;

          const txid = txData.H; // HASH
          const sender = txData.f; // from

          txData.t.forEach((transfers) => {
            const reciever = transfers.o;

            const direction = reciever === address;

            transfers.c.forEach((transfer) => {
              const asset = transfer.a;
              const amount = String(transfer.A).replace(/(\.\d*[1-9])0+$|\.0*$/, '$1');

              const tx = new Transaction({
                ticker: asset,
                txid,
                direction,
                otherSideAddress: direction ? sender : reciever,
                amount,
                datetime: new Date(),
                alias: this.wallet.alias,
              });

              // history.filterAndUpdateTransactions([tx])

              this.eventEmitter.emit(`${this.wallet.parent}-${asset}::new-socket-tx`, {
                unconfirmedTx: tx,
              });
            });
          });
        }
      } catch (error) {
        console.error(error);
      }
    });
  }

  updateParams(params) {
    super.updateParams(params);

    if (params.websocketUrl && this.config.websocketUrl !== params.websocketUrl) {
      this.config.websocketUrl = params.websocketUrl;
      this.disconnectSocket();
      this.connectSocket(this.wallet.address);
    }
  }
}

export default BinanceDex;
