import Explorer from '../Explorer'
import { ExplorerRequestError } from '../../errors/index.js'
import { SEND_TRANSACTION_TYPE } from '../../utils/const'

/**
 * Api docs - https://github.com/qtumproject/qtuminfo-api
 */
class QtumInfoExplorer extends Explorer {
  getAllowedTickers () {
    return ['QTUM']
  }

  getInfoUrl (address) {
    return `${this.getApiPrefix()}/address/${address}`
  }

  modifyInfoResponse (response) {
    return {
      balance: response.balance,
      transactions: [],
    }
  }

  getTransactionsUrl (address) {
    return `${this.getApiPrefix()}/address/${address}/basic-txs`
  }

  getTransactionsParams (address, offset = 0, limit = this.defaultTxLimit) {
    return { offset, limit, reversed: true }
  }

  getTransactionUrl (txId) {
    return `${this.getApiPrefix()}/tx/${txId}`
  }

  modifyTransactionsResponse (response) {
    return Promise.all(response.transactions.map(async ({ id }) => this.getTransaction(id)))
  }

  getTxHash (tx) {
    return tx.hash
  }

  getTxDirection (selfAddress, tx) {
    return tx.inputs && !tx.inputs.find(({ address }) => address === selfAddress)
  }

  getTxOtherSideAddress (selfAddress, tx) {
    if (!tx.inputs) {
      return '...'
    }

    if (this.getTxDirection(selfAddress, tx)) {
      return tx.inputs[0].address
    }

    let valueOutPrev = new this.wallet.BN(0)
    let addressTo = '...'

    tx.outputs.forEach((output) => {
      if (output.address !== selfAddress) {
        if (valueOutPrev.lt(new this.wallet.BN(output.value))) {
          valueOutPrev = new this.wallet.BN(output.value)
          addressTo = output.address
        }
      }
    })

    return addressTo
  }

  getTxValue (selfAddress, tx) {
    let valueIn = new this.wallet.BN(0)
    let valueOut = new this.wallet.BN(0)

    if (!tx.inputs || !tx.outputs) {
      return 0
    }

    tx.inputs.forEach((input) => {
      if (input.address === selfAddress) {
        valueIn = valueIn.add(new this.wallet.BN(input.value))
      }
    })

    tx.outputs.forEach((output) => {
      if (output.address === selfAddress) {
        valueOut = valueOut.add(new this.wallet.BN(output.value))
      }
    })

    const valueDiff = valueIn.sub(valueOut)
    const isInbound = valueDiff.lt(new this.wallet.BN(0))
    const value = valueDiff.abs()

    return Number(this.wallet.toCurrencyUnit(isInbound
      ? value
      : value.sub(new this.wallet.BN(tx.fees))))
  }

  getTxDateTime (tx) {
    return new Date(Number(`${tx.timestamp}000`))
  }

  getUnspentOutputsUrl (address) {
    return `${this.getApiPrefix()}/address/${address}/utxo`
  }

  modifyUnspentOutputsResponse (address, response) {
    return response.map(({ transactionId, outputIndex, scriptPubKey, value }) => ({
      txid: transactionId,
      vout: outputIndex,
      address,
      script: scriptPubKey,
      satoshis: value,
      value,
    }))
  }

  getSendTransactionUrl () {
    return `${this.getApiPrefix()}/tx/send`
  }

  getSendTransactionParam () {
    return 'rawtx'
  }

  modifySendTransactionResponse (response) {
    if (response.status === 1) {
      throw new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error: new Error(response.message), instance: this })
    }

    return {
      txid: response.id,
    }
  }

  /**
   * Calculates the balance.
   *
   * @param {Object[]} utxos The utxos
   * @return {BN} The balance.
   */
  calculateBalance (utxos = []) {
    return utxos.reduce(
      (acc, { value }) => new this.wallet.BN(value).add(acc),
      new this.wallet.BN('0')
    )
  }
}

export default QtumInfoExplorer
