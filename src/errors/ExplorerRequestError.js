import AtomicError from './AtomicError'

class ExplorerRequestError extends AtomicError {
  constructor (args) {
    super(args)
    this.errorData = args.errorData
    this.name = this.constructor.name
  }
}

export default ExplorerRequestError
