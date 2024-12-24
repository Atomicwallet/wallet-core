import Explorer from '../Explorer'

const URL_TRANSACTIONS = 'v1/addr/{address}/transactions'

/**
 * ETC Explorer
 *
 * @abstract
 * @class {Explorer}
 */
class GastrackerExplorer extends Explorer {
  getAllowedTickers () {
    return ['ETC']
  }

  async getTransactions (address) {
    const requestUrl = `${this.config.baseUrl}${URL_TRANSACTIONS.replace('{address}', address)}`
    const { items } = await this.request(requestUrl)
      .catch((error) => {
        throw error
      })

    return this.modifyTransactionsResponse(items, address)
  }

  async getInfo (address) {
    // TODO throw error
    const balance = await this.wallet.coreLibrary.eth.getBalance(address)

    return {
      balance,
      transactions: [],
    }
  }

  getTxHash (tx) {
    return tx.hash
  }

  getTxDirection (selfAddress, tx) {
    return tx.to === selfAddress
  }

  getTxOtherSideAddress (selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.from : tx.to
  }

  getTxValue (selfAddress, tx) {
    return tx.value.ether
  }

  getTxDateTime (tx) {
    return new Date(tx.timestamp)
  }

  getTxConfirmations (tx) {
    return tx.confirmations
  }

  // async sendTransaction (rawtx) {
  //   return new Promise((resolve, reject) => {
  //     this.wallet.coreLibrary.eth.sendSignedTransaction(rawtx)
  //       .on('transactionHash', (hash) => {
  //         resolve({ txid: hash })
  //       })
  //       .catch((error) => {
  //         const modifiedError = new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error, instance: this })

  //         reject(modifiedError)
  //       })
  //   })
  // }
}

export default GastrackerExplorer
