import { INTERNAL_ERROR } from '../utils/const';
import AtomicError from './AtomicError';

class InternalError extends AtomicError {
  defaultType = INTERNAL_ERROR;

  constructor(args) {
    super(args);
    this.name = this.constructor.name;
  }
}

export default InternalError;
