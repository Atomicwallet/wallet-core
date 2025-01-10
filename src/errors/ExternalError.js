import AtomicError from './AtomicError';
import { EXTERNAL_ERROR } from '../utils/const';

class ExternalError extends AtomicError {
  defaultType = EXTERNAL_ERROR;

  constructor(args) {
    super(args);
    this.name = this.constructor.name;
  }
}

export default ExternalError;
