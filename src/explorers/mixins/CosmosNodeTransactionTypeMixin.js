const CosmosNodeTransactionTypeMixin = (superclass) => class extends superclass {
  getTransactionsModifiedResponse (tx, selfAddress, asset = this.wallet.ticker) {
    return Object.assign({
      txType: this.getTransactionType(tx),
    }, super.getTransactionsModifiedResponse(tx, selfAddress, asset))
  }

  getTransactionNativeType (tx) {
    const messages = Array.isArray(tx?.messages) ? tx.messages : []

    return messages.map(({ '@type': nativeType }) => nativeType.split('.').pop())[0]
  }

  getTransactionType (tx) {
    const txType = this.getTransactionNativeType(tx)

    const typesMap = {
      MsgWithdrawDelegatorReward: 'reward',
      MsgDelegate: 'stake',
      MsgUndelegate: 'unstake',
    }

    return typesMap[txType] === undefined ? 'transfer' : typesMap[txType]
  }
}

export default CosmosNodeTransactionTypeMixin
