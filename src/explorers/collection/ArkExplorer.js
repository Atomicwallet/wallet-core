import Explorer from '../Explorer'
import { ExplorerRequestError } from '../../errors/index.js'
import { GET_BALANCE_TYPE, GET_TRANSACTIONS_TYPE, HTTP_STATUS_NOT_FOUND, SEND_TRANSACTION_TYPE } from '../../utils/const'

class ArkExplorer extends Explorer {
  handleRequestError (error, reqArgs) {
    if (error.response?.status === HTTP_STATUS_NOT_FOUND) {

      switch (reqArgs.type) {
        case GET_BALANCE_TYPE: return {
          account: {
            balance: '0',
            transactions: [],
            nonce: 0,
          },
        }
        case GET_TRANSACTIONS_TYPE: return []
      }
    }
    return super.handleRequestError(error, reqArgs)
  }

  getAllowedTickers () {
    return ['ARK']
  }

  getApiPrefix () {
    return 'api'
  }

  getInfoUrl (address) {
    return `${this.getApiPrefix()}/wallets/${address}`
  }

  modifyInfoResponse (response) {
    return {
      balance: response.data.balance,
      transactions: this.wallet.transactions,
      nonce: response.data.nonce,
    }
  }

  getTransactionUrl (txId) {
    return `${this.getApiPrefix()}/transactions/${txId}`
  }

  getTransactionsUrl (address) {
    return `${this.getApiPrefix()}/wallets/${address}/transactions`
  }

  getTransactionsParams (address, offset = 0, limit = this.defaultTxLimit) {
    return { limit, orderBy: 'timestamp:desc', page: offset > limit ? parseInt(offset / limit, 10) : 1 }
  }

  modifyTransactionsResponse (response, address) {
    return super.modifyTransactionsResponse(response.data, address)
  }

  getTxHash (tx) {
    return tx.id
  }

  getTxDirection (selfAddress, tx) {
    return tx.recipient === selfAddress
  }

  getTxOtherSideAddress (selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx)
      ? tx.sender
      : tx.recipient
  }

  getTxValue (selfAddress, tx) {
    return Number(this.wallet.toCurrencyUnit(this.getTxDirection(selfAddress, tx)
      ? tx.amount
      : new this.wallet.BN(tx.amount).add(new this.wallet.BN(tx.fee))))
  }

  getTxDateTime (tx) {
    return new Date(Number(`${tx.timestamp.unix}000`))
  }

  getSendTransactionUrl () {
    return `${this.getApiPrefix()}/transactions`
  }

  getSendTransactionParams (rawtx) {
    return { transactions: [rawtx] }
  }

  modifySendTransactionResponse (response) {
    if (response.data.invalid.length > 0) {
      throw new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error: new Error(response.data.invalid[0]), instance: this })
    }

    if (response.data.broadcast.length === 0) {
      throw new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error: new Error('Not found broadcast transaction'), instance: this })
    }

    return {
      txid: response.data.broadcast[0],
    }
  }

  getTxFee (tx) {
    return this.wallet.toCurrencyUnit((tx && tx.fee) || 0)
  }
}

export default ArkExplorer
