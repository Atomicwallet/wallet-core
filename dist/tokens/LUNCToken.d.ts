export default LUNCToken;
declare class LUNCToken extends Token {
    constructor(args: any);
    denom: any;
    stabilityFee: any;
    createTransaction({ address, amount, userGasPrice, gasLimit, multiplier, feeLimit, memo }: {
        address: any;
        amount: any;
        userGasPrice: any;
        gasLimit: any;
        multiplier: any;
        feeLimit?: number | undefined;
        memo: any;
    }): Promise<{
        address: any;
        amount: any;
        contract: string;
        transfer: boolean;
        ticker: string;
        userGasPrice: any;
        gasLimit: any;
        multiplier: any;
        feeLimit: number;
        denom: any;
        memo: any;
    }>;
    /**
     * @param {BN} amount Amount to send in minimal units
     * @return {String} Stability fee for a given ustc amount in minimal units
     */
    getStabilityFee(amount: BN): string;
}
import { Token } from '../abstract/index.js';
