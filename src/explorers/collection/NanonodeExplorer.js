import ReconnectingWebSocket from 'reconnecting-websocket'

import Explorer from '../Explorer'
import { ExplorerRequestError } from '../../errors/index.js'
import { SEND_TRANSACTION_TYPE, GET_TRANSACTIONS_TYPE } from '../../utils/const'
import Transaction from '../Transaction'
// import history from '../History'

const WEBSOCKET_CONFIG = {
  WebSocket: global.WebSocket,
  connectionTimeout: 2000,
  maxReconnectionDelay: 20000,
  minReconnectionDelay: 10000,
  maxRetries: 10,
}

class NanonodeExplorer extends Explorer {
  /**
   * Safety check
   * @returns []
   */
  getAllowedTickers () {
    return ['NANO']
  }

  /**
   * @returns String
   */
  getBaseUrl () {
    return `${this.config.baseUrl}`
  }

  /**
   * All urls for all methods are the same
   * @returns String
   */
  getSendTransactionUrl () {
    return this.getBaseUrl()
  }

  /**
   */
  getInfoUrl (address) {
    return this.getBaseUrl()
  }

  /**
   * @param  {} txId
   */
  getTransactionUrl (txId) {
    this.requestedTxId = txId

    return ''
  }

  /**
   * All actions are POST with the same URL
   * @returns {'POST'}
   */
  getActionMethod () {
    return 'POST'
  }

  /**
   */
  getTransactionsMethod () {
    return this.getActionMethod()
  }

  /**
   */
  getInfoMethod () {
    return this.getActionMethod()
  }

  /**
   */
  getTransactionMethod () {
    return this.getActionMethod()
  }

  /**
   * @param  {{}} tx
   * @returns {{}}
   */
  getSendTransactionParams (tx) {
    return { action: 'process', json_block: true, ...tx }
  }

  /**
   * @param  {} hash
   * @returns {}
   */
  workGenerateParams (hash) {
    return { action: 'work_generate', hash }
  }

  /**
   * @param  {string} address
   * @returns {{
   *  action: "pending",
   *  account: string,
   *  count: string,
   * }}
   */
  pendingTransactionsParams (address) {
    return {
      action: 'pending',
      account: address,
      count: '100',
    }
  }

  /**
   * @param  {} hash - block hash
   */
  blockInfoParams (hash) {
    return {
      action: 'block_info',
      hash,
      json_block: true,
      source: true,
    }
  }

  /**
   */
  getInfoParams (address) {
    return {
      action: 'account_info',
      account: address,
      pending: true,
      representative: true,
    }
  }

  /**
   * @param address
   * @param  {} offset=0
   * @param  {} limit=this.defaultTxLimit
   */
  getTransactionsParams (address, offset = 0, limit = this.defaultTxLimit) {
    return {
      action: 'account_history',
      account: address,
      count: '100',
    }
  }

  /**
   * @param  {} response
   * @returns {}
   */
  modifySendTransactionResponse (response) {
    if (typeof (response.error) !== 'undefined') {
      throw new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error: new Error(response.error), instance: this })
    }

    this.eventEmitter.emit('socket::newtx::outgoing', { id: this.wallet.id, ticker: this.wallet.ticker })

    return {
      txid: response.hash,
    }
  }

  /**
   * Sends a request to mine tx on node server
   * @param  {} hash
   * @returns String
   */
  async workGenerate (hash) {
    const response = await this.request(
      this.getBaseUrl(),
      this.getActionMethod(),
      this.workGenerateParams(hash),
      'Work generate',
      this.getSendOptions(),
    )

    return response.work
  }

  /**
   * Returns array of pending hash blocks
   */
  async getPendingTransactions (address) {
    const response = await this.request(
      this.getBaseUrl(),
      this.getActionMethod(),
      this.pendingTransactionsParams(address),
    )

    return response
  }

  /**
   * @param  {} hash - block hash
   */
  async getBlockInfo (hash) {
    const response = await this.request(
      this.getBaseUrl(),
      this.getActionMethod(),
      this.blockInfoParams(hash),
      'Block info',
      this.getSendOptions(),
    )

    response.requestedTxId = hash

    return response
  }

  /**
   * @param  {} response
   */
  modifyInfoResponse (response) {
    if (response.error) {
      throw new Error(response.error)
    }

    return response
  }

  /**
   * @param  {} tx
   */
  modifyTransactionResponse (tx, selfAddress) {
    tx.hash = tx.requestedTxId

    return super.modifyTransactionResponse(tx, selfAddress)
  }

  /**
   * @param address
   * @param  {} offset=0
   * @param  {} limit=this.defaultTxLimit
   */
  async getTransactions ({ address, offset = 0, limit = this.defaultTxLimit, pending }) {
    const response = await this.request(
      this.getBaseUrl(),
      this.getTransactionsMethod(),
      this.getTransactionsParams(address, offset, limit),
      GET_TRANSACTIONS_TYPE,
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return this.modifyTransactionsResponse(response.history, this.wallet.address, this.wallet.ticker, pending)
  }

  modifyTransactionsResponse (txs, selfAddress, asset = this.wallet.ticker, pending) {
    if (!Array.isArray(txs)) {
      return []
    }

    return txs.map((tx) => new Transaction({
      ticker: asset,
      name: this.wallet.name,
      walletid: this.wallet.id,
      txid: this.getTxHash(tx),
      fee: this.getTxFee(tx),
      feeTicker: this.wallet.parent,
      direction: this.getTxDirection(selfAddress, tx),
      otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
      amount: this.getTxValue(selfAddress, tx),
      datetime: this.getTxDateTime(tx),
      memo: this.getTxMemo(tx),
      confirmations: this.getTxConfirmations(tx, pending),
      alias: this.wallet.alias,
    }))
  }

  /**
   * @param  {} tx
   */
  getTxHash (tx) {
    return tx.hash
  }

  /**
   * @param  {} tx
   */
  getTxDirection (selfAddress, tx) {
    return tx.type === 'receive'
  }

  /**
   * @param  {} tx
   */
  getTxOtherSideAddress (selfAddress, tx) {
    return tx.account
  }

  /**
   * @param  {} tx
   */
  getTxValue (selfAddress, tx) {
    return Number(this.wallet.toCurrencyUnit(tx.amount))
  }

  /**
   * @param  {} tx
   */
  getTxDateTime (tx) {
    return new Date(Number(`${tx.local_timestamp}000`))
  }

  /**
   * @param  {} tx
   */
  getTxConfirmations (tx, pending) {
    if (pending && pending.includes(tx.hash)) {
      return 0
    }
    return 1
  }

  /**
   * @param  {} txId
   */
  async getTransaction (selfAddress, txId) {
    const tx = await this.getBlockInfo(txId)

    return this.modifyTransactionResponse(tx, selfAddress)
  }

  /**
   * Socket functions
   */

  /**
   * @param  {} endpoint
   */
  setSocketClient (endpoint) {
    this.socket[this.wallet.ticker] = new ReconnectingWebSocket(endpoint, [], WEBSOCKET_CONFIG)
  }

  /**
   * Uses nanovault socket api, not the node's one
   * @returns Promise resolves when connection established
   */
  async connectSocket (address) {
    const { websocketUrl } = this.config
    const { ticker } = this.wallet

    if (!websocketUrl) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(`[${ticker}] connectSocket error: no websocket url in coin config`),
        instance: this,
      })
    }
    this.setSocketClient(websocketUrl)

    const socket = this.socket[ticker]

    socket.addEventListener('message', async (msg) => {
      const jsonData = JSON.parse(msg.data).data

      if (jsonData.subtype === 'send') {
        this.processSendEvent(jsonData, address)
      }

      if (jsonData.subtype === 'receive') {
        this.processReceiveEvent(jsonData, address)
      }
    })

    return new Promise((resolve, reject) => {
      socket.addEventListener('open', () => {
        socket.removeEventListener('error')

        return resolve(socket.send(JSON.stringify({
          event: 'subscribe',
          data: [address],
        })))
      })

      socket.addEventListener('error', (event) => {

        console.error('[NANO][socket] connection failed', websocketUrl, event)
        return reject(event)
      })
    })
  }

  /**
   * Closes socket connection
   */
  disconnectSocket () {
    this.socket[this.wallet.ticker].close()
  }

  updateParams (params) {
    super.updateParams(params)

    if (params.websocketUrl && this.config.websocketUrl !== params.websocketUrl) {
      this.config.websocketUrl = params.websocketUrl
      this.disconnectSocket()
      this.connectSocket(this.wallet.address)
    }
  }

  // @TODO probably should be managed in NANOCoin
  // @FIXME
  /**
   * Procsses send event. It may be an event from another
   * account sidechain to our or outgoing transaction from ours to theirs
   * @param  {} sendEvent
   */
  async processSendEvent (sendEvent, selfAddress) {
    if (sendEvent.confirmed) {
      return
    }
    const treatAsIncoming = sendEvent.account !== selfAddress

    this.eventEmitter.emit(`${this.wallet.parent}-${this.wallet.id}::mine-txs`)

    if (treatAsIncoming) {
      return // do not process pending event, history is broken
    }

    const tx = new Transaction({
      ticker: this.wallet.ticker,
      name: this.wallet.name,
      walletid: this.wallet.id,
      txid: treatAsIncoming ? 'pending' : sendEvent.hash,
      direction: treatAsIncoming,
      otherSideAddress: treatAsIncoming ? sendEvent.account : sendEvent.block.link_as_account,
      amount: this.wallet.toCurrencyUnit(sendEvent.amount),
      datetime: new Date(),
      alias: this.wallet.alias,
    })

    // await history.updatePendingOrInsert(tx)

    this.eventEmitter.emit(`${this.wallet.parent}-${this.wallet.id}::new-socket-tx`, {
      unconfirmedTx: tx,
    })
  }

  /**
   * Proceed the websocket event of incoming tx. That mean we have mined
   * the tx and should update it's hash
   * @param  {} receiveEvent
   */
  async processReceiveEvent (receiveEvent) {
    const link = await this.getBlockInfo(receiveEvent.block.link)

    const tx = new Transaction({
      ticker: this.wallet.ticker,
      name: this.wallet.name,
      txid: receiveEvent.hash,
      walletid: this.wallet.id,
      direction: true,
      otherSideAddress: link.block_account,
      amount: this.wallet.toCurrencyUnit(receiveEvent.amount),
      datetime: new Date(), // @FIXME
      alias: this.wallet.alias,
    })

    // await history.updatePendingOrInsert(tx)

    this.eventEmitter.emit(`${this.wallet.parent}-${this.wallet.id}::new-socket-tx`, {
      unconfirmedTx: tx,
    })
  }

  async getInfo (address) {
    const result = await super.getInfo(address)

    if (result.pending > 0) {
      result.pending = await this.getPendingTransactions(address)
    }

    return result
  }

  getTxFee () {
    return 0
  }
}

export default NanonodeExplorer
