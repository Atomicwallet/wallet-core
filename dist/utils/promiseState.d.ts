export declare const PROMISE_STATE: {
    readonly PENDING: "pending";
    readonly FULFILLED: "fulfilled";
    readonly REJECTED: "rejected";
};
type PromiseState = (typeof PROMISE_STATE)[keyof typeof PROMISE_STATE];
/**
 * Utility function — Gets the state of a promise.
 *
 * @param promise - The promise to evaluate.
 * @returns A promise that resolves to the state of the input promise.
 */
export declare const getPromiseState: <T>(promise: Promise<T>) => Promise<PromiseState>;
export {};
