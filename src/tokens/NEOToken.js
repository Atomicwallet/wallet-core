import { Token } from '../abstract'

export default class NEOToken extends Token {
  #parent

  constructor (args) {
    super(args)
    this.id = 'GAS3'
    this.#parent = args.parent
  }

  async createTransaction ({ address, amount }) {
    return {
      address,
      amount: this.toCurrencyUnit(amount),
      asset: this.ticker,
    }
  }

  sendRawTransaction (args) {
    return this.#parent.sendTransaction(args)
  }

  getFee () {
    return this.#parent.getFee()
  }

  get feeTicker () {
    return this.ticker
  }

  get feeWallet () {
    return this
  }

  isAvailableForFee (userFee) {
    return this.#parent.isAvailableForFee(userFee)
  }
}
