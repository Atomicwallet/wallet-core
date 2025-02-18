import AtomicError from '../errors/AtomicError.js';
declare class InsufficientFundsError extends AtomicError {
    constructor(args: unknown);
}
export default InsufficientFundsError;
