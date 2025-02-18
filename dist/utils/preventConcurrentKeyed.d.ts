/**
 * Prevents concurrent calls of a passed async callback function identified by a key.
 * Returns a scoped function with its own keys namespace.
 *
 * @returns A function that accepts a key and an async callback, ensuring the same promise
 * is returned if called multiple times with the same key while the promise is in a pending state.
 */
declare const createScopedPromiseManager: <T>() => ((key: string, cb: () => Promise<T>) => Promise<T>);
export default createScopedPromiseManager;
