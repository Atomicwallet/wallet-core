/**
 * Prevents concurrent calls of a passed async callback function.
 *
 * @param cb - An async callback function
 * @returns A function that will return the same promise if called multiple times while
 * the promise is in a pending state
 */

const preventConcurrentCalls = <T>(cb: () => Promise<T>): (() => Promise<T>) => {
  let pendingPromise: Promise<T> | null = null;

  return () => {
    if (!pendingPromise) {
      pendingPromise = cb().finally(() => {
        pendingPromise = null;
      });
    }

    return pendingPromise;
  };
};

export default preventConcurrentCalls;
