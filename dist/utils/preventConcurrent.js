/**
 * Prevents concurrent calls of a passed async callback function.
 *
 * @param cb - An async callback function
 * @returns A function that will return the same promise if called multiple times while
 * the promise is in a pending state
 */
const preventConcurrentCalls = (cb) => {
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
export default preventConcurrentCalls;
//# sourceMappingURL=preventConcurrent.js.map