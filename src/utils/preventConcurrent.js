/**
 * Prevents concurrent calls of a passed async callback function.
 *
 * @param {cb: () => Promise<T>} cb
 * @returns {cb: () => Promise<T>} will return same promise if called multiple times while the promise is in pending state
 */
export default (cb) => {
  let pendingPromise = null;

  return () => {
    if (!pendingPromise) {
      pendingPromise = cb().finally(() => {
        pendingPromise = null;
      });
    }

    return pendingPromise;
  };
};
