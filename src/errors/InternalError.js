import AtomicError from './AtomicError';
import { INTERNAL_ERROR } from '../utils/const';

class InternalError extends AtomicError {
  defaultType = INTERNAL_ERROR;

  constructor(args) {
    super(args);
    this.name = this.constructor.name;
  }
}

export default InternalError;
