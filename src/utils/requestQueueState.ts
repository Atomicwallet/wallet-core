export const REQUEST_TYPE = {
  INITIAL_RATES: 'initial_rates',
  WALLETS_LOADED: 'wallets_loaded',
  INITIAL_BALANCES: 'initial_balances',
  INITIAL_TRANSACTIONS: 'initial_transactions',
  NEXT: 'next',
} as const;

type RequestType = (typeof REQUEST_TYPE)[keyof typeof REQUEST_TYPE];

// @TODO Get order from config service
const ordered: RequestType[] = [
  REQUEST_TYPE.INITIAL_RATES,
  REQUEST_TYPE.WALLETS_LOADED,
  REQUEST_TYPE.INITIAL_BALANCES,
  REQUEST_TYPE.INITIAL_TRANSACTIONS,
  REQUEST_TYPE.NEXT,
];

/**
 * RequestState class
 */
class RequestState {
  private isPermitted = false;
  private isCompleted = false;
  promise: Promise<void>;
  private resolve!: () => void;

  constructor(isPermitted?: boolean) {
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
      if (isPermitted) {
        this.setPermitted();
      }
    });
  }

  setPermitted(): void {
    this.isPermitted = true;
    this.resolve();
  }

  setCompleted(): void {
    this.isCompleted = true;
    this.setPermitted();
  }

  getIsCompleted(): boolean {
    return this.isCompleted;
  }
}

/**
 * Stores the state of the request queue for their synchronization
 */
class RequestQueueState {
  private completeState: Record<RequestType, RequestState>;

  constructor() {
    this.completeState = ordered.reduce<Record<RequestType, RequestState>>(
      (result, type, index) => {
        result[type] = new RequestState(index === 0);
        return result;
      },
      {} as Record<RequestType, RequestState>,
    );
  }

  private checkTypeForThrow(type: RequestType): void {
    if (!ordered.includes(type)) {
      throw new Error(`The type '${type}' is not in REQUEST_TYPE`);
    }
  }

  setAsCompleted(type: RequestType): void {
    this.checkTypeForThrow(type);
    this.completeState[type].setCompleted();

    for (let index = 0; index < ordered.length; index++) {
      const requestType = ordered[index] as RequestType;

      this.completeState[requestType].setPermitted();

      if (requestType === type && type !== ordered[ordered.length - 1]) {
        const nextRequestType = ordered[index + 1] as RequestType;
        this.completeState[nextRequestType].setPermitted();
        break;
      }
    }
  }

  async waitForPermitted(type: RequestType): Promise<void> {
    this.checkTypeForThrow(type);
    return this.completeState[type].promise;
  }
}

export const requestQueueState = new RequestQueueState();
