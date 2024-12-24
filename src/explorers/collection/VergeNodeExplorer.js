import Explorer from '../Explorer'

class VergeNodeExplorer extends Explorer {
  getAllowedTickers () {
    return ['XVG']
  }

  getSendTransactionUrl () {
    return this.config.baseUrl
  }

  getSendTransactionParams (rawtx) {
    return {
      method: 'sendrawtransaction',
      params: [rawtx],
    }
  }

  modifySendTransactionResponse (response) {
    return {
      txid: response.result,
    }
  }
}

export default VergeNodeExplorer
