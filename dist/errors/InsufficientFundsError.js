import AtomicError from '../errors/AtomicError.js';
const MODULE_NAME = 'InsufficientFundsError';
class InsufficientFundsError extends AtomicError {
    constructor(args) {
        super(args);
        this.name = MODULE_NAME;
    }
}
export default InsufficientFundsError;
//# sourceMappingURL=InsufficientFundsError.js.map