export default class THETAToken extends Token {
    constructor(args: any);
    get feeWallet(): this;
    createTransaction({ address, amount, userFee }: {
        address: any;
        amount: any;
        userFee: any;
    }): Promise<{
        address: any;
        amount: any;
        contract: string;
        ticker: string;
        userFee: any;
    }>;
    sendTransaction(args: any): Promise<any>;
    /**
     * Returns available balance for send
     *
     * @return {Promise<string>} In currency units
     */
    availableBalance(fee: any): Promise<string>;
    /**
     * Determines if the amount with fee is available for send
     *
     * @param {string} amount - The amount in currency unit
     * @param {string} fee - The fee in currency unit
     * @return {Promise<boolean>} True if available for send, False otherwise.
     */
    isAvailableForSend(amount: string, fee: string): Promise<boolean>;
    /**
     * Does fee wallet has enough balance to send transactions.
     *
     * @param {BN} [userFee]
     * @returns {Promise<boolean>}
     */
    isAvailableForFee(userFee?: BN): Promise<boolean>;
    #private;
}
import { Token } from '../abstract/index.js';
import BN from 'bn.js';
