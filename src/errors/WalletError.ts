import AtomicError from 'src/errors/AtomicError';

const MODULE_NAME = 'WalletError';

class WalletError extends AtomicError {
  constructor(args: unknown) {
    super(args);
    this.name = MODULE_NAME;
  }
}

export default WalletError;
