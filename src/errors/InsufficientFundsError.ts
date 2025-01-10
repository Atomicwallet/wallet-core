import AtomicError from 'src/errors/AtomicError';

const MODULE_NAME = 'InsufficientFundsError';

class InsufficientFundsError extends AtomicError {
  constructor(args: unknown) {
    super(args);
    this.name = MODULE_NAME;
  }
}

export default InsufficientFundsError;
