import AtomicError from '../errors/AtomicError.js';
export default class ExplorerRequestError extends AtomicError {
    private errorData;
    constructor(args: Record<any, any> & {
        errorData?: unknown;
    });
}
