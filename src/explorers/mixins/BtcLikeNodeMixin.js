
const BtcLikeNodeMixin = (superclass) => class extends superclass {
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

export default BtcLikeNodeMixin
