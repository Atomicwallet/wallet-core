import AtomicError from '../errors/AtomicError.js';
export default class ExplorerRequestError extends AtomicError {
    constructor(args) {
        super(args);
        this.errorData = args.errorData;
        this.name = this.constructor.name;
    }
}
//# sourceMappingURL=ExplorerRequestError.js.map