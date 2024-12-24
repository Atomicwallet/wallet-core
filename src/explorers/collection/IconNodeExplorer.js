import IconService from 'icon-sdk-js'

import Explorer from '../Explorer'
import { ExplorerRequestError } from '../../errors/index.js'
import { SEND_TRANSACTION_TYPE } from '../../utils/const'

class IconNodeExplorer extends Explorer {
  constructor (...args) {
    super(...args)
    const provider = new IconService.HttpProvider(`${this.config.baseUrl}${this.getApiPrefix()}`)
    const iconService = new IconService(provider)

    this.service = iconService
    this.sdk = IconService
  }

  getAllowedTickers () {
    return [ 'ICX' ]
  }

  getApiPrefix () {
    return 'api/v3/'
  }

  async getInfo (address) {
    const result = await this.service.getBalance(address).execute()

    return { balance: result.toString() }
  }

  async sendTransaction (rawtx) {
    try {
      const thHash = await this.service.sendTransaction(rawtx).execute()

      return {
        txid: thHash,
      }
    } catch (error) {
      throw new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error, instance: this })
    }
  }

  async call (params) {
    try {
      return this.service.call(params).execute()
    } catch (error) {
      throw new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error, instance: this })
    }
  }

  getTransactionByHash (hash) {
    try {
      return this.service.getTransaction(hash).execute()
    } catch (error) {
      throw new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error, instance: this })
    }
  }

  getTransactionResult (hash) {
    try {
      return this.service.getTransactionResult(hash).execute()
    } catch (error) {
      throw new ExplorerRequestError({ type: SEND_TRANSACTION_TYPE, error, instance: this })
    }
  }
}

export default IconNodeExplorer
