import AtomicError from '../errors/AtomicError.js';
const MODULE_NAME = 'WalletError';
class WalletError extends AtomicError {
    constructor(args) {
        super(args);
        this.name = MODULE_NAME;
    }
}
export default WalletError;
//# sourceMappingURL=WalletError.js.map