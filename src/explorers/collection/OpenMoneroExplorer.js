import Explorer from '../Explorer'
import { ExternalError } from '../../errors/index.js'
import { EXTERNAL_ERROR, GET_UTXO_TYPE } from '../../utils/const'

const OPENMONERO_LOGIN_TYPE = 'OpenMoneroLogin'
const OPENMONERO_IMPORT_TYPE = 'OpenMoneroImport'
const OPENMONERO_RANDOM_TYPE = 'OpenMoneroRandom'
const OPENMONERO_IMPORT_BLOCK_COUNT = 10000

class OpenMoneroExplorer extends Explorer {
  getAllowedTickers () {
    return ['XMR']
  }

  modifyGeneralResponse (response) {
    if (response.data && typeof response.data.status !== 'undefined') {
      if (response.data.status === 'error') {
        throw new ExternalError({
          type: EXTERNAL_ERROR,
          error: new Error(response.data.reason),
          instance: this,
        })
      }
    }
    return response.data
  }

  getInfoUrl () {
    return 'get_address_info'
  }

  getInfoParams () {
    return {
      address: this.wallet.address,
      view_key: this.wallet.privateKeyView,
    }
  }

  getInfoMethod () {
    return 'POST'
  }

  /**
   * Calculate balance from utxo
   */
  async getInfo () {
    const utxos = await this.getUnspentOutputs()

    this.wallet.balance = utxos.reduce((acc, { amount }) => new this.wallet.BN(amount).add(acc),
      new this.wallet.BN('0')
    )

    return {
      balance: this.wallet.balance.toString(),
    }
  }

  async login () {
    const loginParams = {
      address: this.wallet.address,
      view_key: this.wallet.privateKeyView,
      create_account: true,
      generated_locally: true,
    }

    const response = await this.request(
      'login',
      'POST',
      loginParams,
      OPENMONERO_LOGIN_TYPE,
    )

    return response.status === 'success'
  }

  async import () {
    const importParams = {
      address: this.wallet.address,
      view_key: this.wallet.privateKeyView,
      no_blocks_to_import: String(OPENMONERO_IMPORT_BLOCK_COUNT),
    }

    const response = await this.request(
      'import_recent_wallet_request ',
      'POST',
      importParams,
      OPENMONERO_IMPORT_TYPE,
    )

    return response.request_fulfilled
  }

  getTransactionsUrl () {
    return 'get_address_txs'
  }

  getTransactionsMethod () {
    return 'POST'
  }

  getTransactionsParams (offset = 0, limit = this.defaultTxLimit) {
    return {
      address: this.wallet.address,
      view_key: this.wallet.privateKeyView,
    }
  }

  getTransactionUrl (txId) {
    return 'get_tx'
  }

  getTransactionParams (txId) {
    return {
      tx_hash: txId,
    }
  }

  getTransactionMethod () {
    return 'POST'
  }

  modifyTransactionsResponse (response) {
    this.lastHeight = response.blockchain_height

    return super.modifyTransactionsResponse(response.transactions.filter((tx) => {
      if (typeof tx.spent_outputs === 'undefined') {
        // incoming transaction
        return true
      }

      return !this.checkKeyImage(tx.spent_outputs[0].tx_pub_key, tx.spent_outputs[0].out_index, [tx.spent_outputs[0].key_image])
    }))
  }

  getTxHash (tx) {
    return tx.hash
  }

  getTxDirection (tx) {
    return typeof tx.spent_outputs === 'undefined'
  }

  getTxOtherSideAddress (tx) {
    return tx.tx_pub_key
  }

  getTxValue (tx) {
    return Number(this.wallet.toCurrencyUnit(this.getTxDirection(tx)
      ? tx.total_received
      : new this.wallet.BN(tx.total_sent).sub(new this.wallet.BN(tx.total_received))
    ))
  }

  getTxDateTime (tx) {
    return new Date(Number(`${tx.timestamp}`))
  }

  getTxConfirmations (tx) {
    return this.lastHeight - tx.height
  }

  getUnspentOutputsUrl () {
    return 'get_unspent_outs'
  }

  getUnspentOutputsMethod () {
    return 'POST'
  }

  getUnspentOutputsParams () {
    return {
      address: this.wallet.address,
      view_key: this.wallet.privateKeyView,
      amount: '0',
      use_dust: false,
      mixin: this.wallet.defaultMixin,
      dust_threshold: String(this.wallet.dustThreshold),
    }
  }

  async getUnspentOutputs (addr = undefined) {
    await this.login()

    return super.getUnspentOutputs(addr)
  }

  modifyUnspentOutputsResponse (response) {
    return response.outputs.filter((utxo) => this.checkKeyImage(utxo.tx_pub_key, utxo.index, utxo.spend_key_images))
  }

  async getRawUnspentOutputs (addr = undefined) {
    const response = await this.request(
      this.getUnspentOutputsUrl(addr),
      this.getUnspentOutputsMethod(),
      this.getUnspentOutputsParams(),
      GET_UTXO_TYPE,
      this.getUtxoOptions()
    )

    return response
  }

  async getRandomOuts () {
    const randomParams = {
      amounts: '0',
      count: this.wallet.defaultMixin,
    }

    const response = await this.request(
      'get_random_outs',
      'POST',
      randomParams,
      OPENMONERO_RANDOM_TYPE,
    )

    return response
  }

  getSendTransactionUrl () {
    return 'submit_raw_tx'
  }

  getSendTransactionParam () {
    return 'tx'
  }

  getSendTransactionParams (rawtx) {
    this.lastHash = rawtx.hash
    return super.getSendTransactionParams(rawtx.rawTx)
  }

  modifySendTransactionResponse (response) {
    return super.modifySendTransactionResponse({
      txid: this.lastHash,
    })
  }

  checkKeyImage (txPubKey, outIndex, spentOutputs) {
    const keyImage = this.wallet.moneroUtils.generate_key_image(
      txPubKey,
      this.wallet.privateKeyView,
      this.wallet.publicKeySpend,
      this.wallet.privateKeySpend,
      outIndex
    )
    let isUnSpent = true

    for (let index = 0; index < spentOutputs.length; index++) {
      if (spentOutputs[index] === keyImage) {
        isUnSpent = false
        break
      }
    }

    return isUnSpent
  }
}

export default OpenMoneroExplorer
