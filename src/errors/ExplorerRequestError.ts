import AtomicError from 'src/errors/AtomicError';

class ExplorerRequestError extends AtomicError {
  private errorData: unknown;

  constructor(args: Record<any, any> & { errorData: unknown }) {
    super(args);
    this.errorData = args.errorData;
    this.name = this.constructor.name;
  }
}

export default ExplorerRequestError;
