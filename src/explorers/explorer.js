import axios from 'axios'
import io from 'socket.io-client'
// import history from './History'

import { Emitter, TxNotifier } from '../utils'
import Transaction from './Transaction'
import { toCurrency } from '../utils/convert'
import {
  UndeclaredAbstractMethodError,
  ExplorerRequestError,
} from '../errors'
import {
  ONE_MINUTE,
  GET_BLOCK_TYPE,
  GET_TRANSACTIONS_TYPE,
  GET_LATEST_BLOCK_TYPE,
  GET_BALANCE_TYPE,
  GET_UTXO_TYPE,
  GET_TRANSACTION_TYPE,
  SEND_TRANSACTION_TYPE,
  UNDEFINED_OPERATION_ERROR,
} from '../utils/const'
import { TxTypes } from './enum'

const DEFAULT_TX_LIMIT = 100

/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
class Explorer {
  /**
   * Creates an instance of Explorer.
   * @param {*} config
   * @memberof Explorer
   */
  constructor ({ wallet, config }) {
    this.config = config

    this.defaultTxLimit = config.txLimit ?? DEFAULT_TX_LIMIT
    this.wallet = wallet
    this.setAxiosClient()
    this.socket = {}

    this.webUrl = config.webUrl
    this.clients = {}
    this.eventEmitter = Emitter
    this.txNotifier = new TxNotifier(wallet)
    this.canPaginate = false

    this.lastGetInfoRequestTime = null
    this.lastGetTxsRequestTime = null
    this.defaultRequestTimeout = config.defaultRequestTimeout ?? null
  }

  get name () {
    return this.constructor.name
  }

  updateParams (config) {
    this.config = config

    if (config.defaultRequestTimeout) {
      this.defaultRequestTimeout = config.defaultRequestTimeout
    }

    if (config.baseUrl && this.config.baseUrl !== config.baseUrl) {
      this.config.baseUrl = config.baseUrl
      this.setAxiosClient()
    }
    this.webUrl = config.webUrl
  }

  /**
   * Sets socket client.
   *
   * @param {*} endpoint
   * @memberof Explorer
   */
  setSocketClient (endpoint) {
    this.socket[this.wallet.ticker] = io(endpoint, { transports: ['websocket'] })
  }

  /**
   * Sets axios request client.
   */
  setAxiosClient () {
    this.client = axios.create(this.getInitParams())
  }

  /**
   * @param curAmount { String | Number | BN }
   * @returns {*}
   */
  toBNMinimalUnit (curAmount) {
    return new this.wallet.BN(this.wallet.toMinimalUnit(curAmount ?? 0))
  }

  /**
   * @param minAmount { String | Number | BN }
   * @returns {*}
   */
  toBNCurrencyUnit (minAmount) {
    return new this.wallet.BN(this.wallet.toCurrencyUnit(minAmount ?? 0))
  }

  /**
   * Gets the web transaction url.
   *
   * @param {String} txid Transaction ID
   */
  getWebTransactionUrl (txid) {
    return `${this.webUrl}${txid}`
  }

  /**
   * Gets the allowed tickers.
   *
   * @TODO Remove getAllowedIds methods from child classes
   * @deprecated
   * @return {string[]} List of tickers.
   */
  getAllowedTickers () {
    return []
  }

  /**
   * Gets the initialize parameters for axios.
   *
   * @return {Object} The initialize parameters.
   */
  getInitParams () {
    if (!this.config.baseUrl) {
      throw new Error(`${this.wallet.ticker} ${this.constructor.name}: explorer config have no baseUrl`)
    }
    return { baseURL: this.config.baseUrl }
  }

  getApiPrefix () {
    return 'api'
  }

  async checkTransaction (selfAddress, { coin, address, amount, memo, txid, nonce, fee, feeTicker }) {
    const newTx = new Transaction({
      ticker: coin.ticker,
      walletid: coin.id,
      name: coin.name,
      alias: coin.alias,
      explorer: this.constructor.name,
      txid,
      direction: selfAddress === address,
      otherSideAddress: address,
      amount: toCurrency(amount, coin.decimal),
      datetime: new Date(),
      memo,
      nonce,
      confirmations: 0,
      fee,
      feeTicker: feeTicker ?? coin.feeTicker ?? this.getTxFeeTicker(),
    })

    // await history.filterAndUpdateTransactions([newTx])

    return newTx
  }

  /**
   * Gets the information about a wallet.
   *
   * @return {Promise<Object>} The information data.
   */
  async getInfo (address) {
    if (!address || typeof address !== 'string') {
      throw this.createError('getInfo: address must be string with length > 0')
    }
    if (this.defaultRequestTimeout && (Date.now() - (this.defaultRequestTimeout * ONE_MINUTE)) < this.lastGetInfoRequestTime) {
      return this.modifyInfoResponse(undefined)
    }

    if (this.defaultRequestTimeout && (Date.now() - (this.defaultRequestTimeout * ONE_MINUTE)) > this.lastGetInfoRequestTime) {
      this.lastGetInfoRequestTime = Date.now()
    }

    const response = await this.request(
      this.getInfoUrl(address),
      this.getInfoMethod(),
      this.getInfoParams(address),
      GET_BALANCE_TYPE,
      this.getInfoOptions(),
    )

    return this.modifyInfoResponse(response)
  }

  /**
   * Gets the information url.
   *
   * @return {String}
   */
  getInfoUrl (address) {
    throw new UndeclaredAbstractMethodError('getInfoUrl', this)
  }

  /**
   * Gets the info method.
   *
   * @return {String}
   */
  getInfoMethod () {
    return 'get'
  }

  /**
   * Gets the info parameters.
   *
   * @return {Object}
   */
  getInfoParams (address) {
    return {}
  }

  /**
   * Gets the info request options
   *
   * @returns {Object}
   */
  getInfoOptions () {
    return {
      transformResponse: [(data) => {
        return JSON.parse(data.replace(/:(\d+)([,}])/g, ':"$1"$2'))
      }],
    }
  }

  /**
   * Gets the single transactions request options
   *
   * @returns {Object}
   */
  getTransactionOptions () {
    return {}
  }

  /**
   * Gets the transactions request options
   *
   * @returns {Object}
   */
  getTransactionsOptions () {
    return {}
  }

  /**
   * Gets the UTXO request options
   *
   * @returns {Object}
   */
  getUtxoOptions () {
    return {}
  }

  /**
   * Gets the last block request options
   *
   * @returns {Object}
   */
  getLatestBlockOptions () {
    return {}
  }

  /**
   * Gets the send request options
   *
   * @returns {Object}
   */
  getSendOptions () {
    return {}
  }

  /**
   * Modify info response
   *
   * @param {Object} response
   */
  modifyInfoResponse (response) {
    // todo: set wallet balance here!!!
    // this.wallet.balance = ?????

    return response
  }

  /**
   * Gets the transaction info.
   *
   * @param {String} txId The transaction identifier.
   * @return {Promise<Object>} The transaction.
   */
  async getTransaction (selfAddress, txId, tokens = []) {
    const response = await this.request(
      this.getTransactionUrl(txId),
      this.getTransactionMethod(),
      this.getTransactionParams(txId),
      GET_TRANSACTION_TYPE,
      this.getTransactionOptions()
    )

    return this.modifyTransactionResponse(response, selfAddress, tokens)
  }

  getTransactionModifiedResponse (tx, selfAddress, asset = this.wallet.ticker) {
    return Object.assign({
      explorer: this.constructor.name,
      locktime: tx && tx.lockTime,
    }, this.getTransactionsModifiedResponse(tx, selfAddress, asset))
  }

  getTransactionsModifiedResponse (tx, selfAddress, asset = this.wallet.ticker) {
    return {
      ticker: asset,
      name: this.wallet.name,
      walletid: this.wallet.id,
      txid: this.getTxHash(tx),
      direction: this.getTxDirection(selfAddress, tx),
      otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
      amount: this.getTxValue(selfAddress, tx),
      datetime: this.getTxDateTime(tx),
      memo: this.getTxMemo(tx),
      confirmations: this.getTxConfirmations(tx),
      nonce: this.getTxNonce(tx),
      alias: this.wallet.alias,
      fee: this.getTxFee(tx),
      feeTicker: this.getTxFeeTicker(),
      txType: this.getTxType(tx),
    }
  }

  /**
   * Gets the get transaction url.
   *
   * @param {String} txId
   * @abstract
   * @return {String}
   */
  getTransactionUrl (txId) {
    throw new UndeclaredAbstractMethodError('getTransactionUrl', this)
  }

  /**
   * Gets the get transaction method name.
   *
   * @return {String}
   */
  getTransactionMethod () {
    return 'get'
  }

  /**
   * Gets the get transaction params.
   *
   * @param {String} txId
   * @return {Object}
   */
  getTransactionParams (txId) {
    return {}
  }

  /**
   * Modify transaction response
   *
   * @param {Object} tx
   * @return {Transaction}
   */
  modifyTransactionResponse (tx, selfAddress, asset = this.wallet.ticker) {
    return new Transaction(this.getTransactionModifiedResponse(tx, selfAddress, asset))
  }

  /**
   * Get a transactions list for a wallet
   *
   * @return {Promise<Object[]>}
   */
  async getTransactions ({ address, offset, limit, pageNum }) {
    if (this.defaultRequestTimeout && (Date.now() - (this.defaultRequestTimeout * ONE_MINUTE)) < this.lastGetTxsRequestTime) {
      return []
    }

    if (this.defaultRequestTimeout && (Date.now() - (this.defaultRequestTimeout * ONE_MINUTE)) > this.lastGetTxsRequestTime) {
      this.lastGetTxsRequestTime = Date.now()
    }

    const response = await this.request(
      this.getTransactionsUrl(address, offset || 0, limit || this.defaultTxLimit, pageNum),
      this.getTransactionsMethod(),
      this.getTransactionsParams(address, offset || 0, limit || this.defaultTxLimit, pageNum),
      GET_TRANSACTIONS_TYPE,
      this.getTransactionsOptions()
    )

    return this.modifyTransactionsResponse(response, address)
  }

  /**
   * Get transaction list url
   *
   * @abstract
   * @return {String}
   */
  getTransactionsUrl (address, offset, limit, pageNum) {
    throw new UndeclaredAbstractMethodError('getTransactionsUrl', this)
  }

  /**
   * Get transaction list method
   *
   * @return {String}
   */
  getTransactionsMethod () {
    return 'get'
  }

  /**
   * Get transaction list params
   *
   * @return {Object}
   */
  getTransactionsParams (address, offset = 0, limit = this.defaultTxLimit, pageNum) {
    return { from: offset, to: offset + limit }
  }

  /**
   * Modify transaction list response
   *
   * @param {Object[]} txs
   */
  modifyTransactionsResponse (txs, address) {
    if (!Array.isArray(txs)) {
      return []
    }

    return txs.map((tx) => new Transaction(this.getTransactionsModifiedResponse(tx, address)))
  }

  /**
   * Gets the utxos data.
   *
   * @return {Promise<Object[]>} The utxos data.
   */
  async getUnspentOutputs (address, scriptPubKey) {
    const response = await this.request(
      this.getUnspentOutputsUrl(address),
      this.getUnspentOutputsMethod(),
      this.getUnspentOutputsParams(address),
      GET_UTXO_TYPE,
      this.getUtxoOptions()
    )

    return this.modifyUnspentOutputsResponse(address, response, scriptPubKey)
  }

  /**
   * Gets the utx operating system url.
   *
   * @abstract
   * @return {String}
   */
  getUnspentOutputsUrl (address) {
    throw new UndeclaredAbstractMethodError('getUnspentOutputsUrl', this)
  }

  /**
   * Gets the unspent outputs method.
   *
   * @return {String}
   */
  getUnspentOutputsMethod () {
    return 'get'
  }

  /**
   * Gets the utx operating system params.
   *
   * @abstract
   * @return {Object}
   */
  getUnspentOutputsParams (address) {
    return {}
  }

  /**
   * Modify unspent outputs response
   *
   * @param {Object} response
   */
  modifyUnspentOutputsResponse (address, response, scriptPubKey) {
    return response
  }

  /**
   * Sends a transaction.
   *
   * @param {*} rawtx The rawtx
   * @return {Promise<Object>} The transaction data
   */
  async sendTransaction (rawtx) {
    const response = await this.request(
      this.getSendTransactionUrl(),
      this.getSendTransactionMethod(),
      this.getSendTransactionParams(rawtx),
      SEND_TRANSACTION_TYPE,
      this.getSendOptions(),
    )

    // @TODO update balances should managed from coin
    // @FIXME
    // this.wallet.getInfo() // update balance

    return this.modifySendTransactionResponse(response)
  }

  /**
   * Gets the send transaction url.
   *
   * @abstract
   * @return {String}
   */
  getSendTransactionUrl () {
    throw new UndeclaredAbstractMethodError('getSendTransactionUrl', this)
  }

  /**
   * Gets the send transaction method.
   *
   * @return {String}
   */
  getSendTransactionMethod () {
    return 'post'
  }

  /**
   * Gets the send transaction param name.
   *
   * @abstract
   * @return {String}
   */
  getSendTransactionParam () {
    return 'txid'
  }

  /**
   * Gets the send transaction param name.
   *
   * @abstract
   * @return {Object}
   */
  getSendTransactionParams (rawtx) {
    return { [this.getSendTransactionParam()]: rawtx }
  }

  /**
   * Modify send transaction response
   *
   * @param {Object} response
   */
  modifySendTransactionResponse (response) {
    return response
  }

  getHeaders () {
    return {}
  }

  /**
   * Handles request errors. Returns fallback response data for recoverable or false errors, throws ExplorerRequestError otherwise.
   *
   * @param {import('axios').AxiosError} error
   * @param {object} req request arguments
   * @param {string} req.url The url
   * @param {string} req.method The method
   * @param {object} req.params The data
   * @param {string} req.type Type of request
   * @param {object} req.options options
   * @throws {ExplorerRequestError}
   * @returns {object}
   */
  handleRequestError (error, { url, method, params, type, options }) {
    const {
      headers: requestHeaders,
      method: requestMethod,
      baseURL,
      url: requestUrl,
      data: requestData,
    } = error?.config || {}

    const errorData = {
      request: { headers: requestHeaders, method: requestMethod, baseURL, url: requestUrl, data: requestData },
    }

    if (error.response) {
      const { data: responseData, status, statusText, headers: responseHeaders } = error.response
      const responseObject = { data: responseData, status, statusText, headers: responseHeaders }

      errorData.response = responseObject
    } else {
      errorData.response = 'No response data available'
    }

    throw new ExplorerRequestError({
      type,
      error: new Error(JSON.stringify(errorData)),
      errorData,
      url: `${this.config.baseUrl}${url}`,
      instance: this,
    })
  }

  /**
   * The request to the explorer
   *
   * @param {string} url The url
   * @param {import('axios').Method} method The method
   * @param {object} params The data
   * @param {String} type Type of request
   * @param {object} options Other request options
   * @return {Promise<object>}
   */
  async request (url, method = 'get', params = {}, type = UNDEFINED_OPERATION_ERROR, options = {}) {
    // @FIXME for refactoring
    // should be  deleted after success
    if (url.search('undefined') !== -1) {
      throw new Error(`corrupted url: ${url}`)
    }

    try {
      return this.modifyGeneralResponse(
        await this.client.request({ url, method, [method === 'get' ? 'params' : 'data']: params, ...options })
      )
    } catch (error) {
      if (error.isAxiosError) {
        return this.handleRequestError(error, { url, method, params, type, options })
      }
      throw new ExplorerRequestError({
        type,
        error,
        url: `${this.config.baseUrl}${url}`,
        instance: this,
      })
    }
  }

  /**
   * Modify general response
   *
   * @param {Object} response
   */
  modifyGeneralResponse (response) {
    return response.data
  }

  /**
   * Return tx nonce
   *
   * @param tx
   * @return {string}
   */
  getTxNonce (tx) {
    return undefined
  }

  /**
   * Gets the transaction fee.
   *
   * @param {Object} tx The transaction response.
   * @return {Number} The transaction fee.
   */
  getTxFee (tx) {
    return this.wallet.toCurrencyUnit(tx.fee || this.wallet.feeDefault || 0)
  }

  /**
   * Gets the transaction amount.
   *
   * @param {Object} tx The transaction
   * @return {Number} The transaction amount.
   */
  getTxValue (address, tx) {
    throw new UndeclaredAbstractMethodError('getTxValue', this)
  }

  /**
   * Gets the transaction direction.
   *
   * @param {Object} tx The transaction
   * @return {Boolean} The transaction direction.
   */
  getTxDirection (selfAddress, tx) {
    return tx.vin && !tx.vin.find(({ addr }) => addr === selfAddress) && true
  }

  /**
   * Gets the transaction recipient.
   *
   * @param {Object} tx The transaction response.
   * @return {(Boolean|String)} The transaction recipient.
   */
  getTxOtherSideAddress (selfAddress, tx) {
    if (tx.vin) {
      if (this.getTxDirection(selfAddress, tx)) {
        return tx.vin[0].addr
      }

      const vout = tx.vout.find(({ scriptPubKey: { addresses } }) => (
        !addresses.includes(selfAddress)
      ))

      if (vout) {
        return vout.scriptPubKey.addresses[0]
      }
    }

    return '...'
  }

  /**
   * Gets the transaction datetime.
   *
   * @param {Object} tx The transaction response
   * @return {Date} The transaction datetime.
   */
  getTxDateTime (tx) {
    return new Date(Number(`${tx.time}000`))
  }

  /**
   * Gets the transaction date.
   *
   * @param {Object} tx The transaction response
   * @return {String} The transaction date.
   */
  getTxDate (tx) {
    return this.getTxDateTime(tx)
      .toDateString()
      .slice(4) // eslint-disable-line no-magic-numbers
  }

  /**
   * Gets the transaction time.
   *
   * @param {Object} tx The transaction response
   * @return {String} The transaction time.
   */
  getTxTime (tx) {
    return this.getTxDateTime(tx)
      .toTimeString()
      .slice(0, 5) // eslint-disable-line no-magic-numbers
  }

  /**
   * Gets the transaction confirmations.
   *
   * @param {Object} tx The transaction response.
   * @return {Number} The transaction confirmations.
   */
  getTxConfirmations (tx) {
    return tx.confirmations || 0
  }

  /**
   * Gets the transaction hash.
   *
   * @param {Object} tx The transaction response.
   * @return {String} The transaction hash.
   */
  getTxHash (tx) {
    return tx.txid
  }

  /**
   * Gets the transaction memo/payment-id.
   *
   * @param {Object} tx The transaction response
   */
  getTxMemo (tx) {
    return ''
  }

  getTxFeeTicker () {
    return this.wallet.ticker
  }

  /**
   * Returns defined tx type const
   *
   * @param tx
   * @returns {*|string}
   */
  getTxType (tx) {
    return TxTypes[tx.type] || TxTypes.TRANSFER
  }

  /**
   * Gets the balance.
   *
   * @return {Promise<String>}
   */
  async getBalance (address, useSatoshis = false) {
    const info = await this.getInfo(address)

    if (info && info.balance) {
      if (useSatoshis) {
        return info.balance
      }
      return String(this.wallet.toCurrencyUnit(info.balance))
    }

    return null
  }

  /**
   * @return {String}
   */
  getLatestBlockUrl () {
    throw new UndeclaredAbstractMethodError('getLatestBlockUrl', this)
  }

  /**
   * @return {String}
   */
  getLatestBlockMethod () {
    return 'get'
  }

  /**
   * @return {Object}
   */
  getLatestBlockParams () {
    return {}
  }

  /**
   * @return {Object}
   */
  modifyLatestBlockResponse (response) {
    return response
  }

  /**
   * @return {Promise<Object>}
   */
  async getLatestBlock () {
    const response = await this.request(
      this.getLatestBlockUrl(),
      this.getLatestBlockMethod(),
      this.getLatestBlockParams(),
      GET_LATEST_BLOCK_TYPE,
      this.getLatestBlockOptions()
    )

    return this.modifyLatestBlockResponse(response)
  }

  getBlockUrl () {
    throw new UndeclaredAbstractMethodError('getBlockUrl', this)
  }

  getBlockMethod () {
    throw new UndeclaredAbstractMethodError('getBlockMethod', this)
  }

  getBlockParams () {
    throw new UndeclaredAbstractMethodError('getBlockParams', this)
  }

  getBlockOptions () {
    throw new UndeclaredAbstractMethodError('getBlockParams', this)
  }

  async getBlock (hash) {
    const response = await this.request(
      this.getBlockUrl(hash),
      this.getBlockMethod(),
      this.getBlockParams(),
      GET_BLOCK_TYPE,
      this.getBlockOptions()
    )

    return this.modifyGetBlockResponse(response)
  }

  modifyGetBlockResponse (response) {
    return response
  }

  getTxLimit () {
    return this.defaultTxLimit
  }

  createError (msg) {
    return new Error(`[${this.wallet.ticker}] ${this.constructor.name} Error: ${msg}`)
  }

  async getSocketTransaction ({ address, hash, tokens, type, scriptPubKey }) {
    const newTx = await this.getTransaction(address, hash, tokens)

    // await history.filterAndUpdateTransactions([newTx])

    this.txNotifier.notify(type, newTx, newTx.walletid, newTx.ticker, hash)
  }

  /**
   * Stub for make NFT info url
   *
   * @param {string} contractAddress - Contract address.
   * @param {string} [tokenId] - Token id.
   * @returns {string} - NFT info url.
   * @throws {UndeclaredAbstractMethodError}
   */
  makeNftInfoUrl (contractAddress, tokenId) {
    throw new UndeclaredAbstractMethodError('makeNftInfoUrl', this)
  }

  /**
   * Stub for fetch NFT list
   *
   * @async
   * @param {Object<Coin>} coin
   * @returns {Promise<Object<NftToken>[]>}
   * @throws {UndeclaredAbstractMethodError}
   */
  async fetchNftList (coin) {
    throw new UndeclaredAbstractMethodError('fetchNftList', this)
  }

  /**
   * Stub for send NFT to other wallet
   *
   * @async
   * @param {Object<Coin>} coin
   * @param {string} toAddress - destination wallet address.
   * @param {string} [contractAddress] - NFT contract address.
   * @param {string} [tokenId] - Token id.
   * @param {string} [tokenStandard] - Token standard.
   * @param {Object} [options] - Some custom user options.
   * @returns {Promise<{tx: string}>} - Transaction hash.
   * @throws {UndeclaredAbstractMethodError}
   */
  async sendNft (coin, toAddress, contractAddress, tokenId, tokenStandard, options) {
    throw new UndeclaredAbstractMethodError('fetchNftList', this)
  }
}

export default Explorer
