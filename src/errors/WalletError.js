import AtomicError from './AtomicError';

const MODULE_NAME = 'WalletError';

class WalletError extends AtomicError {
  constructor(args) {
    super(args);
    this.name = MODULE_NAME;
  }
}

export default WalletError;
