import AtomicError from '../errors/AtomicError.js';
declare class InternalError extends AtomicError {
    defaultType: string;
    constructor(args: unknown);
}
export default InternalError;
