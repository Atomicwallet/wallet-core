import AtomicError from 'src/errors/AtomicError';

import { EXTERNAL_ERROR } from '../utils/const';

class ExternalError extends AtomicError {
  defaultType = EXTERNAL_ERROR;

  constructor(args: unknown) {
    super(args);
    this.name = this.constructor.name;
  }
}

export default ExternalError;
