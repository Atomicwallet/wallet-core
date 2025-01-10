/** @enum */
export const REQUEST_TYPE = {
  INITIAL_RATES: 'initial_rates',
  WALLETS_LOADED: 'wallets_loaded',
  INITIAL_BALANCES: 'initial_balances',
  INITIAL_TRANSACTIONS: 'initial_transactions',
  NEXT: 'next',
};

// @TODO Get order from config service
/** @type REQUEST_TYPE[] */
const ordered = [
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
  /** @type boolean */
  #isPermitted = false;
  #isCompleted = false;

  /**
   * Constructs RequestState class
   *
   * @param {boolean} [isPermitted] - Sets `isPermitted` property to true.
   */
  constructor(isPermitted) {
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
      if (isPermitted) {
        this.setPermitted();
      }
    });
  }

  setPermitted() {
    this.#isPermitted = true;
    this.resolve();
  }

  setCompleted() {
    this.#isCompleted = true;
    this.setPermitted();
  }

  /**
   * Checks for completed status
   *
   * @returns {boolean}
   */
  getIsCompleted() {
    return this.#isCompleted;
  }
}

/**
 * @typedef {Object.<REQUEST_TYPE, RequestState>} RequestStateObj
 */

/**
 * Stores the state of the request queue for their synchronization
 */
class RequestQueueState {
  /** @type RequestStateObj */
  #completeState = ordered.reduce((result, type, index) => {
    result[type] = new RequestState(index === 0 ? true : undefined);
    return result;
  }, {});

  /**
   * @param {REQUEST_TYPE} type
   * @returns {void}
   * @throws {Error} - When the type is not in REQUEST_TYPE.
   */
  #checkTypeForThrow(type) {
    if (!ordered.includes(type)) {
      throw new Error(`The type '${type}' is not in REQUEST_TYPE`);
    }
  }

  /**
   * Sets request state as completed
   *
   * @param {REQUEST_TYPE} type
   * @returns {void}
   * @throws {Error} - When the type is not in REQUEST_TYPE.
   */
  setAsCompleted(type) {
    this.#checkTypeForThrow(type);
    this.#completeState[type].setCompleted();

    for (let index = 0; index < ordered.length; index++) {
      const requestType = ordered[index];

      // Set as permitted all requests which was completed before
      this.#completeState[requestType].setPermitted();

      if (requestType === type && type !== ordered[ordered.length - 1]) {
        // And also set as permitted next request after this
        const nextRequestType = ordered[index + 1];

        this.#completeState[nextRequestType].setPermitted();
        break;
      }
    }
  }

  /**
   * Waiting for the permitted state for the request
   *
   * @async
   * @param {REQUEST_TYPE} type
   * @returns {Promise<void>}
   * @throws {Error} - When the type is not in REQUEST_TYPE.
   */
  waitForPermitted(type) {
    this.#checkTypeForThrow(type);
    return this.#completeState[type].promise;
  }
}

const requestQueueState = new RequestQueueState();

export { requestQueueState };
