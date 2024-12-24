import BN from 'bn.js'
import Explorer from '../Explorer'
import { PURESTAKE_EXPLORER_API_KEY } from '../../env'

class PurestakeExplorer extends Explorer {
  getAllowedTickers () {
    return ['ALGO']
  }

  getApiPrefix () {
    return 'v1'
  }

  getInfoOptions () {
    return {
      headers: {
        'X-API-Key': PURESTAKE_EXPLORER_API_KEY,
      },
    }
  }

  getTransactionsOptions () {
    return this.getInfoOptions()
  }

  getTransactionOptions () {
    return this.getInfoOptions()
  }

  getLatestBlockOptions () {
    return this.getInfoOptions()
  }

  getSendOptions () {
    return this.getInfoOptions()
  }

  getInfoUrl (address) {
    return `${this.getApiPrefix()}/account/${address}`
  }

  modifyInfoResponse (response) {
    return {
      balance: new BN(response && response.amount).toString(),
    }
  }

  getTransactionUrl (txId) {
    return `${this.getApiPrefix()}/transaction/${txId}`
  }

  getTransactionsUrl (address) {
    return `${this.getApiPrefix()}/account/${address}/transactions`
  }

  getTransactionsParams (address, offset = 0, limit = this.defaultTxLimit) {
    return {}
  }

  async getTransactions (address, offset = 0, limit = this.defaultTxLimit) {
    this.latestBlock = await this.getLatestBlock()

    return super.getTransactions(address, offset, limit)
  }

  modifyTransactionsResponse (response, address) {
    return super.modifyTransactionsResponse(response && response.transactions, address)
  }

  getTxDirection (selfAddress, tx) {
    return tx.payment.to === selfAddress
  }

  getTxOtherSideAddress (selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx)
      ? tx.from
      : tx.payment.to
  }

  getTxValue (selfAddress, tx) {
    return Number(this.wallet.toCurrencyUnit(this.getTxDirection(selfAddress, tx)
      ? tx.payment.amount
      : new this.wallet.BN(tx.payment.amount).add(new this.wallet.BN(tx.fee))))
  }

  getTxDateTime (tx) {
    return new Date(Number(`${tx.timestamp}000`))
  }

  getTxConfirmations (tx) {
    if (this.latestBlock) {
      return this.latestBlock.lastRound - tx.lastRound
    }

    return 1
  }

  async getBalance (address, coinOnly = false) {
    const info = await this.getInfo(address, coinOnly)

    return info && info.balance
  }

  getSendTransactionUrl () {
    return `${this.getApiPrefix()}/transactions`
  }

  getSendTransactionParams (rawtx) {
    return { RawTransaction: rawtx }
  }

  getLatestBlockUrl () {
    return `${this.getApiPrefix()}/status`
  }
}

export default PurestakeExplorer
