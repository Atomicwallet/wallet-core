export const REQUEST_TYPE = {
    INITIAL_RATES: 'initial_rates',
    WALLETS_LOADED: 'wallets_loaded',
    INITIAL_BALANCES: 'initial_balances',
    INITIAL_TRANSACTIONS: 'initial_transactions',
    NEXT: 'next',
};
// @TODO Get order from config service
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
    constructor(isPermitted) {
        this.isPermitted = false;
        this.isCompleted = false;
        this.promise = new Promise((resolve) => {
            this.resolve = resolve;
            if (isPermitted) {
                this.setPermitted();
            }
        });
    }
    setPermitted() {
        this.isPermitted = true;
        this.resolve();
    }
    setCompleted() {
        this.isCompleted = true;
        this.setPermitted();
    }
    getIsCompleted() {
        return this.isCompleted;
    }
}
/**
 * Stores the state of the request queue for their synchronization
 */
class RequestQueueState {
    constructor() {
        this.completeState = ordered.reduce((result, type, index) => {
            result[type] = new RequestState(index === 0);
            return result;
        }, {});
    }
    checkTypeForThrow(type) {
        if (!ordered.includes(type)) {
            throw new Error(`The type '${type}' is not in REQUEST_TYPE`);
        }
    }
    setAsCompleted(type) {
        this.checkTypeForThrow(type);
        this.completeState[type].setCompleted();
        for (let index = 0; index < ordered.length; index++) {
            const requestType = ordered[index];
            this.completeState[requestType].setPermitted();
            if (requestType === type && type !== ordered[ordered.length - 1]) {
                const nextRequestType = ordered[index + 1];
                this.completeState[nextRequestType].setPermitted();
                break;
            }
        }
    }
    async waitForPermitted(type) {
        this.checkTypeForThrow(type);
        return this.completeState[type].promise;
    }
}
export const requestQueueState = new RequestQueueState();
//# sourceMappingURL=requestQueueState.js.map