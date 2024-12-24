
class ExchangeConfirmsCalculationError extends Error {
  constructor (options) {
    super('Remaining confirmations cannot be calculated', options)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.name = this.constructor.name
  }
}

export default ExchangeConfirmsCalculationError
