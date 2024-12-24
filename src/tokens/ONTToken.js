import { Token } from '../abstract'

export default class ONTToken extends Token {
  #parent

  constructor (args) {
    super(args)
    this.id = this.ticker
    this.#parent = args.parent
  }

  async createTransaction ({ address, amount }) {
    return {
      address,
      amount,
      asset: this.ticker,
    }
  }

  async sendTransaction (args) {
    const rawTx = await this.#parent.createTransaction(args)

    return this.#parent.sendTransaction(rawTx)
  }

  sendRawTransaction (args) {
    return this.#parent.sendTransaction(args)
  }

  getFee () {
    return this.#parent.getFee()
  }

  get feeWallet () {
    return this
  }

  get feeTicker () {
    return this.ticker
  }

  isAvailableForFee (userFee) {
    return this.#parent.isAvailableForFee(userFee)
  }
}
