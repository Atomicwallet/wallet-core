import Explorer from '../Explorer'
import { GET_TRANSACTIONS_TYPE } from '../../utils/const'
import Transaction from '../Transaction'
import { toCurrency } from '../../utils/convert'

/**
 * Solana Surf REST-API explorer
 *
 */
class SolanaSurfExplorer extends Explorer {
  getAllowedTickers () {
    return ['SOL']
  }

  getApiPrefix () {
    return '/v1'
  }

  getTransactionsMethod () {
    return 'get'
  }

  getTransactionsUrl (address) {
    return `${this.getApiPrefix()}/account/${address}/transactions`
  }

  getTransactionsParams () {
    return {}
  }

  getTransactionOptions () {
    return {}
  }

  async getTransactions ({ address, offset, limit, pageNum }) {
    const response = await this.request(
      this.getTransactionsUrl(address),
      this.getTransactionsMethod(),
      this.getTransactionsParams(),
      GET_TRANSACTIONS_TYPE,
      this.getTransactionsOptions()
    )

    return this.modifyTransactionsResponse(response, address)
  }

  modifyTransactionsResponse (txs, selfAddress) {
    return txs.map((tx) => {
      const transfer = this.getInstruction(tx)

      return new Transaction({
        ticker: this.wallet.ticker,
        name: this.wallet.name,
        alias: this.wallet.alias,
        walletid: this.wallet.id,
        explorer: this.constructor.name,
        txid: this.getTxHash(tx),
        direction: this.getTxDirection(selfAddress, transfer),
        otherSideAddress: this.getTxOtherSideAddress(selfAddress, transfer),
        amount: this.getTxValue(selfAddress, transfer),
        datetime: this.getTxDateTime(tx),
        memo: this.getTxMemo(tx),
        confirmations: 1,
      })
    })
  }

  getInstruction (tx) {
    return tx.instructions[0].parsed.Transfer
  }

  getTxHash (tx) {
    return tx.transactionHash
  }

  getTxDirection (selfAddress, tx) {
    return tx.account.address !== selfAddress
  }

  getTxOtherSideAddress (selfAddress, tx) {
    return tx.recipient.address
  }

  getTxValue (selfAddress, tx) {
    return toCurrency(tx.lamports, this.wallet.decimal)
  }

  getTxDateTime (tx) {
    return new Date(Number(`${tx.blocktime.absolute}000`))
  }
}

export default SolanaSurfExplorer
