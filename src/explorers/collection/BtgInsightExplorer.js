import axios from 'axios'

import DgbInsightExplorer from './DgbInsightExplorer.js'

class BtgInsightExplorer extends DgbInsightExplorer {
  getAllowedTickers () {
    return ['BTG']
  }

  getInfoUrl (address) {
    return `insight-api/addr/${address}`
  }

  getTransactionUrl (txId) {
    return `insight-api/tx/${txId}`
  }

  getTransactionsUrl (address) {
    return `insight-api/addrs/${address}/txs`
  }

  modifyTransactionsResponse (response, address) {
    return super.modifyTransactionsResponse(response.items, address)
  }

  getUnspentOutputsUrl (address) {
    return `insight-api/addr/${address}/utxo`
  }

  getSendTransactionUrl () {
    return 'insight-api/tx/send'
  }

  getSendTransactionParam () {
    return 'rawtx'
  }

  async sendTransaction (rawtx) {
    const response = await axios.post(
      `${this.config.baseUrl}${this.getSendTransactionUrl()}`,
      `${this.getSendTransactionParam()}=${rawtx}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    return this.modifyGeneralResponse(this.modifySendTransactionResponse(response))
  }
}

export default BtgInsightExplorer
