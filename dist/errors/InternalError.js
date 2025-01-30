import AtomicError from '../errors/AtomicError.js';
import { INTERNAL_ERROR } from '../utils/const/index.js';
class InternalError extends AtomicError {
    constructor(args) {
        super(args);
        this.defaultType = INTERNAL_ERROR;
        this.name = this.constructor.name;
    }
}
export default InternalError;
//# sourceMappingURL=InternalError.js.map