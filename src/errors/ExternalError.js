import { EXTERNAL_ERROR } from '../utils/const';
import AtomicError from './AtomicError';

class ExternalError extends AtomicError {
  defaultType = EXTERNAL_ERROR;

  constructor(args) {
    super(args);
    this.name = this.constructor.name;
  }
}

export default ExternalError;
