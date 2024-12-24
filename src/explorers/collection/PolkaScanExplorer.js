import BN from 'bn.js'
import Explorer from '../Explorer'

class PolkaScanExplorer extends Explorer {
  getAllowedTickers () {
    return ['DOT']
  }

  getApiPrefix () {
    return 'api'
  }

  getInfoUrl (address) {
    return `${this.getApiPrefix()}/scan/search`
  }

  getInfoMethod () {
    return 'POST'
  }

  getInfoParams (address) {
    return {
      key: address,
      page: 0,
      row: 1,
    }
  }

  modifyInfoResponse (response) {
    const data = {
      balance: 0,
      ring_lock: 0,
      nonce: 0,
    }

    if (response.data && response.data.account) {
      data.balance = new BN(this.wallet.toMinimalUnit(response.data.account.balance))
        .sub(new BN(this.wallet.toMinimalUnit(response.data.account.ring_lock)))
        .toString()
      data.ring_lock = response.data.account.ring_lock
      data.nonce = response.data.account.nonce
    }

    return {
      balance: data.balance,
      balances: {
        available: this.wallet.toCurrencyUnit(data.balance),
        staking: data.ring_lock,
      },
      transactions: this.wallet.transactions,
      nonce: data.nonce,
    }
  }

  getTransactionUrl (txId) {
    return `${this.getApiPrefix()}/scan/extrinsic`
  }

  getTransactionMethod () {
    return 'POST'
  }

  getTransactionParams (txId) {
    return {
      hash: txId,
    }
  }

  getTransactionsMethod () {
    return 'POST'
  }

  getTransactionsUrl (address) {
    return `${this.getApiPrefix()}/v2/scan/transfers`
  }

  getTransactionsParams (address, offset = 0, limit = this.defaultTxLimit) {
    return {
      address,
      page: offset > this.defaultTxLimit ? parseInt(offset / this.defaultTxLimit, 10) : 0,
      row: limit,
    }
  }

  modifyTransactionsResponse (response, address) {
    if (!response?.data?.transfers) {
      return []
    }

    return super.modifyTransactionsResponse(response.data.transfers.filter(({ success }) => success), address)
  }

  getTxHash (tx) {
    return tx.hash
  }

  getTxDirection (selfAddress, tx) {
    return tx.to === selfAddress
  }

  getTxOtherSideAddress (selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx)
      ? tx.from
      : tx.to
  }

  getTxValue (selfAddress, tx) {
    return Number(tx.amount)
  }

  getTxDateTime (tx) {
    return new Date(Number(`${tx.block_timestamp}000`))
  }

  getTxConfirmations (tx) {
    return Number(tx.success) || 0
  }

  getTxFee (tx) {
    return this.wallet.toCurrencyUnit((tx && tx.fee) || 0)
  }
}

export default PolkaScanExplorer
