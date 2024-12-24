import { providers, networks } from '@thetalabs/theta-js'
import Explorer from '../Explorer'
// import logger from '../Logger'

const INIT_PROVIDER_TIMEOUT = 10000
const TICKER_FROM_PROVIDER = /(theta|tfuel)wei/i
const ACCOUNT_NOT_FOUND_ERROR = -32000

export default class ThetaJSExplorer extends Explorer {
  getAllowedTickers () {
    return ['THETA', 'TFUEL']
  }

  constructor (...args) {
    super(...args)

    this.initProvider()
  }

  /**
   * Retry init thetaJS provider each 10 seconds
   * if `new providers.HttpProvider` throws error for some reason
   *
   * @param {object} config - Configuration
   * @param {string} config.chainId - Chain ID (`mainnet` / `testnet`)
   * @param {string} config.baseUrl - Theta node JsonRPC url
   */
  initProvider ({
    chainId,
    baseUrl,
  } = this.config) {
    try {
      this.provider = new providers.HttpProvider(
        chainId || networks.Mainnet.chainId,
        baseUrl || networks.Mainnet.rpcUrl
      )
    } catch (error) {
      // logger.error({
      //   instance: this,
      //   error,
      // })

      setTimeout(() => this.initProvider({
        chainId,
        baseUrl,
      }), INIT_PROVIDER_TIMEOUT)
    }
  }

  async getLatestBlockNumber () {
    return this.provider.getBlockNumber()
  }

  /**
   * @typedef {string} Ticker - `TFUEL`, `THETA` etc.
   * @typedef {string} Amount - In minimal units
   *
   * @typedef {object} ThetaAccount
   * @property {number} sequence - Transactions nonce
   * @property {Object.<Ticker, Amount>} coins - Balances
   * @property {boolean} emptyAddress - `true` if address is only created on paper, `false` otherwise
   */

  /**
   * @param {string} address
   * @returns {Promise<ThetaAccount>}
   */
  async getAccount (address) {
    try {
      const account = await this.provider.getAccount(address)

      return {
        ...account,
        coins: Object.entries(account.coins).reduce((obj, [coin, amount]) => ({
          ...obj,
          [this.getTickerFromProvider(coin)]: amount,
        }), {}),
        emptyAddress: false,
      }
    } catch (error) {
      if (error.code === ACCOUNT_NOT_FOUND_ERROR) {
        return {
          sequence: 0,
          coins: {},
          emptyAddress: true,
        }
      }

      // logger.error({
      //   instance: this,
      //   error,
      // })

      return {
        sequence: 0,
        coins: {},
        emptyAddress: true,
      }
    }
  }

  async sendTransaction (rawtx) {
    const tx = await this.provider.sendTransaction(rawtx)

    return {
      txid: tx.hash,
    }
  }

  /**
   *
   * @param {string} providerTicker - `thetawei` / `tfuelwei`
   * @returns {string} `THETA` / `TFUEL`
   */
  getTickerFromProvider (providerTicker) {
    return (
      providerTicker.match(TICKER_FROM_PROVIDER)?.[1] || providerTicker
    ).toUpperCase()
  }
}
