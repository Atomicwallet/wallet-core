/**
 * Prevents concurrent calls of a passed async callback function identified by a key.
 * Returns a scoped function with its own keys namespace.
 *
 * @returns A function that accepts a key and an async callback, ensuring the same promise
 * is returned if called multiple times with the same key while the promise is in a pending state.
 */
const createScopedPromiseManager = <T>(): ((key: string, cb: () => Promise<T>) => Promise<T>) => {
  const pendingPromises = new Map<string, Promise<T>>();

  return (key: string, cb: () => Promise<T>): Promise<T> => {
    if (!pendingPromises.has(key)) {
      const promise = cb().finally(() => {
        pendingPromises.delete(key);
      });

      pendingPromises.set(key, promise);
    }
    return pendingPromises.get(key)!;
  };
};

export default createScopedPromiseManager;
