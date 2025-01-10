export const PROMISE_STATE = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
} as const;

type PromiseState = (typeof PROMISE_STATE)[keyof typeof PROMISE_STATE];

/**
 * Utility function — Gets the state of a promise.
 *
 * @param promise - The promise to evaluate.
 * @returns A promise that resolves to the state of the input promise.
 */
export const getPromiseState = async <T>(promise: Promise<T>): Promise<PromiseState> => {
  const UNFULFILLED_RESPONSE = {};

  return Promise.race([promise, UNFULFILLED_RESPONSE])
    .then((value) => (value === UNFULFILLED_RESPONSE ? PROMISE_STATE.PENDING : PROMISE_STATE.FULFILLED))
    .catch(() => PROMISE_STATE.REJECTED);
};
