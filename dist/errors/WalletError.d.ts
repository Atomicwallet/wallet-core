import AtomicError from '../errors/AtomicError.js';
declare class WalletError extends AtomicError {
    constructor(args: unknown);
}
export default WalletError;
