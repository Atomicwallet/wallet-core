import AtomicError from './AtomicError'

const MODULE_NAME = 'InsufficientFundsError'

class InsufficientFundsError extends AtomicError {
  constructor (args) {
    super(args)
    this.name = MODULE_NAME
  }
}

export default InsufficientFundsError
