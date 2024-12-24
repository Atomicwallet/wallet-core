import axios from 'axios'
import bitcoinCashAddressTools from 'bchaddrjs'

import Explorer from '../Explorer'

class BlockbookExplorer extends Explorer {
  constructor (args) {
    super(args)
    this.version = args.config.version
  }

  getWalletAddress () {
    return this.wallet.address
  }

  getAllowedTickers () {
    return ['GRS']
  }

  getApiPrefix () {
    return `api/v${this.version}/`
  }

  getAddressUrl (address) {
    return `${this.getApiPrefix()}address/${address}`
  }

  getInfoUrl (address) {
    return `${this.getApiPrefix()}address/${address}`
  }

  modifyInfoResponse (response) {
    return {
      balance: response.balanceSat,
      transactions: [],
    }
  }

  getTransactionUrl (txId) {
    return `${this.getApiPrefix()}tx/${txId}`
  }

  getTransactionsUrl (address) {
    return `${this.getApiPrefix()}address/${address}?details=txs&filter=All`
  }

  modifyTransactionsResponse (response, selfAddress) {
    return super.modifyTransactionsResponse(response.txs, selfAddress)
  }

  getUnspentOutputsUrl (address) {
    return `${this.getApiPrefix()}addrs/${address}/utxo`
  }

  modifyUnspentOutputsResponse (response) {
    return response.map(({ address, txid, vout, scriptPubKey: script, satoshis: value }) => ({
      txid,
      txId: txid, // DGB
      vout,
      script,
      value,
      address: this.modifyUnspentAddress(address),
      outputIndex: vout, // BTC
      satoshis: Number(value),
    }))
  }

  modifyUnspentAddress (address) {
    if (['BCH', 'BSV'].includes(this.wallet.ticker)) {
      return bitcoinCashAddressTools.isCashAddress(address)
        ? address
        : bitcoinCashAddressTools.toCashAddress(address)
    }

    return address
  }

  getTransactionsParams (address, offset, limit) {
    return {}
  }

  getSendTransactionUrl () {
    return `${this.getApiPrefix()}tx/send`
  }

  getSendTransactionParam () {
    return 'rawtx'
  }

  async sendTransaction (rawtx) {
    const response = await axios.post(
      `${this.config.baseUrl}${this.getSendTransactionUrl()}`,
      { [this.getSendTransactionParam()]: rawtx },
    )

    return this.modifyGeneralResponse(
      this.modifySendTransactionResponse(response)
    )
  }

  /**
   * Gets the transaction datetime.
   *
   * @param {Object} tx The transaction response
   * @return {Date} The transaction datetime.
   */
  getTxDateTime (tx) {
    return tx.time ? new Date(Number(`${tx.time}000`)) : new Date()
  }

  /**
   * Gets the trasaction amount.
   *
   * @param {Object} tx The trasaction
   * @return {Number} The trasaction amount.
   */
  getTxValue (selfAddress, tx) {
    let valueIn = new this.wallet.BN(0)
    let valueOut = new this.wallet.BN(0)

    if (!tx.vin || !tx.vout) {
      return 0
    }

    tx.vin.forEach((input) => {
      if (input.addresses.includes(selfAddress)) {
        valueIn = valueIn.add(new this.wallet.BN(this.wallet.toMinimalUnit(input.value)))
      }
    })

    tx.vout.forEach((output) => {
      if (output.scriptPubKey && output.scriptPubKey.addresses && output.scriptPubKey.addresses.length > 0) {
        if (output.scriptPubKey.addresses[0] === selfAddress) {
          valueOut = valueOut.add(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)))
        }
      }
    })

    const valueDiff = valueIn.sub(valueOut)
    const isInbound = valueDiff.lt(new this.wallet.BN(0))
    const value = valueDiff.abs()

    return Number(this.wallet.toCurrencyUnit(
      isInbound
        ? value
        : value.sub(new this.wallet.BN(this.wallet.toMinimalUnit(tx.fees)))
    ))
  }

  /**
   * Gets the trasaction direction.
   *
   * @param {Object} tx The trasaction
   * @return {Boolean} The trasaction direction.
   */
  getTxDirection (selfAddress, tx) {
    return tx.vin && !tx.vin.find(({ addresses }) => addresses.includes(selfAddress))
  }

  /**
   * Gets the trasaction recipient.
   *
   * @param {Object} tx The transaction response.
   * @return {(Boolean|String)} The transaction recipient.
   */
  getTxOtherSideAddress (selfAddress, tx) {
    if (!tx.vin) {
      return '...'
    }

    if (this.getTxDirection(selfAddress, tx)) {
      return tx.vin[0].addresses[0] // todo: check if many?
    }

    let valueOutPrev = new this.wallet.BN(0)
    let addressTo = '...'

    tx.vout.forEach((output) => {
      if (output.scriptPubKey && output.scriptPubKey.addresses && output.scriptPubKey.addresses.length > 0) {
        if (output.scriptPubKey.addresses[0] !== selfAddress) {
          if (valueOutPrev.lt(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)))) {
            valueOutPrev = new this.wallet.BN(this.wallet.toMinimalUnit(output.value))
            addressTo = output.scriptPubKey.addresses[0]
          }
        }
      }
    })

    return addressTo
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

export default BlockbookExplorer
