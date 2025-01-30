export const PROMISE_STATE = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected',
};
/**
 * Utility function — Gets the state of a promise.
 *
 * @param promise - The promise to evaluate.
 * @returns A promise that resolves to the state of the input promise.
 */
export const getPromiseState = async (promise) => {
    const UNFULFILLED_RESPONSE = {};
    return Promise.race([promise, UNFULFILLED_RESPONSE])
        .then((value) => (value === UNFULFILLED_RESPONSE ? PROMISE_STATE.PENDING : PROMISE_STATE.FULFILLED))
        .catch(() => PROMISE_STATE.REJECTED);
};
//# sourceMappingURL=promiseState.js.map