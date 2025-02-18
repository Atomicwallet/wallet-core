export declare const REQUEST_TYPE: {
    readonly INITIAL_RATES: "initial_rates";
    readonly WALLETS_LOADED: "wallets_loaded";
    readonly INITIAL_BALANCES: "initial_balances";
    readonly INITIAL_TRANSACTIONS: "initial_transactions";
    readonly NEXT: "next";
};
type RequestType = (typeof REQUEST_TYPE)[keyof typeof REQUEST_TYPE];
/**
 * Stores the state of the request queue for their synchronization
 */
declare class RequestQueueState {
    private completeState;
    constructor();
    private checkTypeForThrow;
    setAsCompleted(type: RequestType): void;
    waitForPermitted(type: RequestType): Promise<void>;
}
export declare const requestQueueState: RequestQueueState;
export {};
