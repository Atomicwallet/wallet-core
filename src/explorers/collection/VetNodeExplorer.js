import BigNumber from 'bignumber.js'
import { abi } from 'thor-devkit'

import Explorer from '../Explorer'
import Transaction from '../Transaction'
import { getTokenId } from '../../utils'
import { SEND_TRANSACTION_TYPE } from '../../utils/const'

BigNumber.config({
  DECIMAL_PLACES: 50,
  EXPONENTIAL_AT: 50,
})

const CONFIRMATIONS = 10

const VTHO_CONTRACT = '0x0000000000000000000000000000456e65726779'
const VTHO_EVENT_ABI = {
  'anonymous': false,
  'inputs': [
    {
      'indexed': true,
      'name': '_from',
      'type': 'address',
    },
    {
      'indexed': true,
      'name': '_to',
      'type': 'address',
    },
    {
      'indexed': false,
      'name': '_value',
      'type': 'uint256',
    },
  ],
  'name': 'Transfer',
  'type': 'event',
}

const ABI_EVENT = new abi.Event(VTHO_EVENT_ABI)

class VetNodeExplorer extends Explorer {
  getAllowedTickers () {
    return ['VET', 'VTHO']
  }

  getApiPrefix () {
    return ''
  }

  getInfoUrl (address) {
    return `${this.getApiPrefix()}accounts/${address}`
  }

  getInfoOptions () {
    return ''
  }

  normalizeBalance (responseValue) {
    const nonScientificValue = String(responseValue)

    // to handle balance in scientific notation, like: "1.129e+21"
    const matchEPlus = nonScientificValue.match(/^[\d.]+e\+(\d+)$/)

    // only e+ (big numbers)
    if (matchEPlus) {
      return Number(nonScientificValue).toPrecision(Number(matchEPlus[1]) + 1)
    }

    const matchEMinus = nonScientificValue.match(/^([\d.]+)e-(\d+)$/)

    // only e- (small numbers)
    if (matchEMinus) {
      const valueParts = String(nonScientificValue).match(/^([\d.]+)e-(\d+)$/)

      return `0.${new Array(parseInt(valueParts[2], 10)).join('0')}${valueParts[1].replace('.', '')}`
    }

    return nonScientificValue
  }

  modifyInfoResponse (response) {
    /*
    * Response balances represented as a String(hexadecimal)
    * so we need to convert it to type Number by `parseInt()`
    * which may cause a SAFE_NUMBER overflow
    * BigNumber deals with it
    */

    const balance = new BigNumber(response.balance).toString()
    const energy = new BigNumber(response.energy).toString()

    return {
      balance,
      energy,
    }
  }

  async getTransactions ({ address, offset = 0, limit = this.defaultTxLimit }) {
    this.latestBlock = await this.getLatestBlock()

    let txs

    try {
      txs = await super.getTransactions({ address, offset, limit })
    } catch (error) {
      if (error?.errorData?.response?.status === 404) {
        return []
      }

      throw error
    }

    const response = await this.request(
      this.getTransfersUrl(),
      this.getTransactionsMethod(),
      this.getTransfersParams(address, offset, limit),
      'GetTxs',
      this.getTransactionsOptions()
    )

    const transfers = this.modifyTransfersResponse(response, address)

    return txs.concat(transfers)
  }

  getTransfersParams (address, offset = 0, limit = this.defaultTxLimit) {
    const modifiedAddress = this.addLeadingZeros(address)

    const { number } = this.latestBlock

    const params = {
      range: {
        unit: 'block',
        from: 0,
        to: number,
      },
      options: {
        offset,
        limit,
      },
      criteriaSet: [
        {
          address: VTHO_CONTRACT,
          topic0: modifiedAddress,
        },
        {
          address: VTHO_CONTRACT,
          topic1: modifiedAddress,
        },
        {
          address: VTHO_CONTRACT,
          topic2: modifiedAddress,
        },
      ],
      order: 'desc',
    }

    return JSON.stringify(params)
  }

  getTransactionsParams (address, offset = 0, limit = this.defaultTxLimit) {
    const { number } = this.latestBlock

    const params = {
      range: {
        unit: 'block',
        from: 1,
        to: number,
      },
      options: {
        offset,
        limit,
      },
      criteriaSet: [
        {
          recipient: address,
        },
        {
          sender: address,
        },
      ],
      order: 'desc',
    }

    return JSON.stringify(params)
  }

  getTransactionsMethod () {
    return 'post'
  }

  getTransactionMethod () {
    return 'get'
  }

  getTransactionUrl (txId) {
    return `transactions/${txId}/receipt`
  }

  getTransactionParams (txId) {
    return { txId, raw: true }
  }

  getTransactionsUrl (address) {
    return 'logs/transfer'
  }

  getTransfersUrl () {
    return 'logs/event'
  }

  modifyTransactionResponse (tx, selfAddress, asset = this.wallet.ticker) {
    const { meta, outputs = undefined } = tx
    const vetTx = outputs[0] && outputs[0].transfers[0]

    if (vetTx) {
      return this.modifyTransactionsResponse([{ meta, ...vetTx }], selfAddress)[0]
    }

    const vthoTx = outputs[0] && outputs[0].events[0]

    if (vthoTx) {
      return this.modifyTransfersResponse([{ meta, ...vthoTx }], selfAddress)[0]
    }

    return undefined
  }

  modifyTransactionsResponse (response, address) {
    const txs = []

    response.forEach((tx) => {
      txs.push(new Transaction({
        ticker: this.wallet.ticker,
        name: this.wallet.name,
        walletid: this.wallet.id,
        txid: this.getTxHash(tx),
        fee: this.getTxFee(tx),
        feeTicker: this.wallet.parent,
        direction: this.getTxDirection(address, tx.sender),
        otherSideAddress: this.getTxOtherSideAddress(address, tx.sender, tx.recipient),
        amount: this.getTxValue(address, tx.amount),
        datetime: this.getTxDateTime(tx.meta.blockTimestamp),
        memo: this.getTxMemo(tx),
        confirmations: this.getTxConfirmations(tx.meta.blockNumber),
        alias: this.wallet.alias,
      }))
    })

    return txs
  }

  modifyTransfersResponse (response, address, asset = 'VTHO') {
    const transfers = []

    response.forEach((transfer) => {
      // eslint-disable-next-line id-match
      const { _from, _to, _value } = ABI_EVENT.decode(transfer.data, transfer.topics)

      transfers.push(new Transaction({
        ticker: asset,
        name: 'VeThor',
        walletid: getTokenId({ ticker: asset, contract: VTHO_CONTRACT, parent: this.wallet.parent }),
        txid: this.getTxHash(transfer),
        fee: this.getTxFee(transfer),
        feeTicker: this.wallet.parent,
        direction: this.getTxDirection(address, _from),
        otherSideAddress: this.getTxOtherSideAddress(address, _from, _to),
        amount: this.wallet.toCurrencyUnit(_value),
        datetime: this.getTxDateTime(transfer.meta.blockTimestamp),
        memo: this.getTxMemo(transfer),
        confirmations: this.getTxConfirmations(transfer.meta.blockNumber),
        alias: this.wallet.alias,
      }))
    })

    return transfers
  }

  getTxHash (tx) {
    return tx.meta.txID
  }

  getTxDirection (selfAddress, sender) {
    return sender.toLowerCase() !== selfAddress.toLowerCase()
  }

  getTxOtherSideAddress (selfAddress, from, to) {
    return from.toLowerCase() === selfAddress.toLowerCase() ? to : from
  }

  getTxValue (selfAddress, amount) {
    return this.wallet.toCurrencyUnit(new BigNumber(amount).toString())
  }

  getTxDateTime (timestamp) {
    return new Date(Number(`${timestamp.toString()}000`))
  }

  getTxConfirmations (block) {
    if (this.latestBlock) {
      return this.latestBlock.number - block
    }
    return Number(CONFIRMATIONS)
  }

  getLatestBlockUrl () {
    return `${this.getApiPrefix()}blocks/best`
  }

  getSendTransactionParams (rawtx) {
    return { raw: rawtx }
  }

  getSendTransactionUrl () {
    return 'transactions'
  }

  async sendTransaction (rawtx) {
    const response = await this.request(
      this.getSendTransactionUrl(),
      this.getSendTransactionMethod(),
      this.getSendTransactionParams(rawtx),
      SEND_TRANSACTION_TYPE,
      this.getSendOptions()
    )

    return this.modifySendTransactionResponse(response)
  }

  /**
   * @param response
   * @returns {{txid: string}}
   */
  modifySendTransactionResponse (response) {
    if (typeof response.id === 'undefined') {
      throw new TypeError(response)
    }

    return {
      txid: response.id,
    }
  }

  addLeadingZeros (value) {
    const normalSize = 66

    // eslint-disable-next-line prefer-const
    let [leadingZeros, addrPart] = value.split('0x')

    leadingZeros = '0x'
    const sizeExceed = normalSize - addrPart.length

    while (leadingZeros.length < sizeExceed) {
      leadingZeros += '0'
    }

    return leadingZeros + addrPart
  }

  removeLeadingZero (value) {
    return String(value).replace(/^0+/, '')
  }

  getTxFee () {
    return this.wallet.feeDefault
  }
}

export default VetNodeExplorer
