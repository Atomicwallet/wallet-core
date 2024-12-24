import Explorer from '../Explorer'
import { IcxTxTypes } from '../../utils/const'

class IconExplorer extends Explorer {
  getAllowedTickers () {
    return [ 'ICX' ]
  }

  getApiPrefix () {
    return 'v3/'
  }

  getInfoUrl (address) {
    return `${this.getApiPrefix()}address/info`
  }

  getInfoParams (address) {
    return {
      address,
    }
  }

  modifyInfoResponse (response) {
    return {
      balance: this.wallet.toMinimalUnit(response.data?.balance),
      transactions: [],
    }
  }

  getTransactionsUrl (address) {
    return `${this.getApiPrefix()}address/txList`
  }

  getTransactionsParams (address, offset = 0) {
    return {
      address,
      page: offset > this.defaultTxLimit ? parseInt(offset / this.defaultTxLimit, 10) : 1,
      count: this.defaultTxLimit,
    }
  }

  modifyTransactionsResponse (response, address) {
    return super.modifyTransactionsResponse(response.data, address)
  }

  async getTransactions ({ address, offset = 0, limit = this.defaultTxLimit }) {
    this.latestBlock = await this.getLatestBlock()

    return super.getTransactions({ address, offset, limit })
  }

  getTxHash (tx) {
    return tx.txHash
  }

  getTxDirection (selfAddress, tx) {
    switch (tx.txType) {
      case IcxTxTypes.TXTYPE_CLAIM:
        return true
      default:
        break
    }
    return tx.toAddr === selfAddress
  }

  getTxOtherSideAddress (selfAddress, tx) {
    switch (tx.txType) {
      case IcxTxTypes.TXTYPE_STAKE:
        return 'Stake'
      case IcxTxTypes.TXTYPE_DELEGATE:
        return 'Delegate'
      case IcxTxTypes.TXTYPE_CLAIM:
        return 'Claim reward'
      default:
        return this.getTxDirection(selfAddress, tx) ? tx.fromAddr : tx.toAddr
    }
  }

  getTxValue (selfAddress, tx) {
    return tx.amount
  }

  getTxDateTime ({ createDate = '' }) {
    return new Date(createDate)
  }

  getTxConfirmations (tx) {
    if (this.latestBlock) {
      return this.latestBlock.height - tx.height
    }
    return 1
  }

  getLatestBlockUrl () {
    return `${this.getApiPrefix()}block/list`
  }

  getLatestBlockParams () {
    return {
      count: 1,
    }
  }

  modifyLatestBlockResponse (response) {
    return response.data[0]
  }

  getSendTransactionUrl () {
    super.getSendTransactionUrl()
  }

  getTxFee (tx) {
    return (tx && tx.fee) || 0
  }
}

export default IconExplorer
