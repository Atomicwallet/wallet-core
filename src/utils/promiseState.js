/** enum */
export const PROMISE_STATE = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
}

/**
 * Utility fn - Gets the promise state
 *
 * @param {Promise} promise
 * @returns {Promise<{PROMISE_STATE}>}
 */
export const getPromiseState = (promise) => {
  const UNFULFILLED_RESPONSE = {}

  return Promise.race([
    promise,
    UNFULFILLED_RESPONSE,
  ])
    .then((value) => value === UNFULFILLED_RESPONSE ? PROMISE_STATE.PENDING : PROMISE_STATE.FULFILLED)
    .catch(() => PROMISE_STATE.REJECTED)
}
