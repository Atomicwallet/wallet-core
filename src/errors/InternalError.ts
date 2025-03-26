import AtomicError from 'src/errors/AtomicError';
import { INTERNAL_ERROR } from 'src/utils';

class InternalError extends AtomicError {
  defaultType = INTERNAL_ERROR;

  constructor(args: unknown) {
    super(args);
    this.name = this.constructor.name;
  }
}

export default InternalError;
