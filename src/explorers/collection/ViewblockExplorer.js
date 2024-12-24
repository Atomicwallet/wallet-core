import Explorer from '../Explorer'
import { VIEWBLOCK_API_KEY } from '../../env'

const DEFAULT_TX_LIMIT = 25

class ViewblockExplorer extends Explorer {
  constructor (...args) {
    super(...args)

    this.defaultTxLimit = DEFAULT_TX_LIMIT
    this.defaultRequestTimeout = 4
  }

  getAllowedTickers () {
    return ['ZIL']
  }

  getWalletAddress () {
    return this.activeWalletAddress
  }

  getInfoUrl (address) {
    return `/addresses/${address}`
  }

  getTransactionsUrl (address) {
    return `/addresses/${address}/txs`
  }

  getTransactionUrl (txid) {
    return `/txs/${txid}`
  }

  getInfoParams () {
    return {
      network: 'mainnet',
      page: 1,
      type: 'all',
    }
  }

  getInfoOptions () {
    return {
      headers: {
        'X-APIKEY': VIEWBLOCK_API_KEY,
      },
    }
  }

  getTransactionsOptions () {
    return this.getInfoOptions()
  }

  getTransactionOptions () {
    return this.getInfoOptions()
  }

  getUtxoOptions () {
    return this.getInfoOptions()
  }

  getSendOptions () {
    return this.getInfoOptions()
  }

  getLatestBlockOptions () {
    return this.getInfoOptions()
  }

  modifyInfoResponse (response = []) {
    const walletInfo = response

    return {
      balance: walletInfo.balance,
      nonce: walletInfo.nonce,
    }
  }

  getTransactionsParams (address, offset = 0, limit = this.defaultTxLimit) {
    return {
      network: 'mainnet',
      page: 1 + parseInt(offset / limit, 10),
      type: 'all',
    }
  }

  modifyTransactionsResponse (response, address) {
    return super.modifyTransactionsResponse(response, address)
  }

  getTxHash (tx) {
    return tx.hash
  }

  getTxDateTime (tx) {
    return new Date(Number(`${tx.timestamp}`))
  }

  getTxDirection (selfAddress, tx) {
    return tx.to === selfAddress
  }

  getTxOtherSideAddress (selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.from : tx.to
  }

  getTxValue (selfAddress, tx) {
    return this.wallet.toCurrencyUnit(new this.wallet.BN(tx.value))
  }

  getTxConfirmations (tx) {
    return 1
  }
}

export default ViewblockExplorer
