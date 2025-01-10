/**
 * Prevents concurrent calls of a passed async callback function identified by a key.
 * Returns a scoped function with its own keys namespace.
 *
 * @returns {<T>(key: string, cb: () => Promise<T>) => Promise<T>}
 *    will return same promise if called multiple times with the same key while the promise is in pending state
 */
export default () => {
  const pendingPromises = new Map();

  return (key, cb) => {
    if (!pendingPromises.has(key)) {
      const promise = cb().finally(() => {
        pendingPromises.delete(key);
      });

      pendingPromises.set(key, promise);
    }
    return pendingPromises.get(key);
  };
};
