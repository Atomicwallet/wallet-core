/**
 * Prevents concurrent calls of a passed async callback function.
 *
 * @param cb - An async callback function
 * @returns A function that will return the same promise if called multiple times while
 * the promise is in a pending state
 */
declare const preventConcurrentCalls: <T>(cb: () => Promise<T>) => (() => Promise<T>);
export default preventConcurrentCalls;
