import AtomicError from '../errors/AtomicError.js';
import { EXTERNAL_ERROR } from '../utils/const/index.js';
class ExternalError extends AtomicError {
    constructor(args) {
        super(args);
        this.defaultType = EXTERNAL_ERROR;
        this.name = this.constructor.name;
    }
}
export default ExternalError;
//# sourceMappingURL=ExternalError.js.map