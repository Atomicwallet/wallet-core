import Explorer from '../Explorer'

/**
 * Algorand node REST-API explorer
 *
 */
const API_VERSION = 'v2'

class AlgoNodeExplorer extends Explorer {
  getAllowedTickers () {
    return ['ALGO']
  }

  getApiPrefix () {
    return API_VERSION
  }

  getSendTransactionUrl () {
    return `${this.getApiPrefix()}/transactions`
  }

  getSendTransactionParams (rawtx) {
    return rawtx
  }

  getSendOptions () {
    return { headers: { 'Content-Type': 'application/x-binary' } }
  }

  getLatestBlockUrl () {
    return `${this.getApiPrefix()}/transactions/params`
  }

  getTxFee (tx) {
    return this.wallet.toCurrencyUnit((tx && tx.fee) || 0)
  }

  modifySendTransactionResponse (response) {
    return {
      txid: response.txId,
    }
  }
}

export default AlgoNodeExplorer
