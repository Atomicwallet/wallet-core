import AtomicError from '../errors/AtomicError.js';
declare class ExternalError extends AtomicError {
    defaultType: string;
    constructor(args: unknown);
}
export default ExternalError;
