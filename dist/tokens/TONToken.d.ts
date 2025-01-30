export default TONToken;
declare class TONToken extends Token {
    constructor(args: any);
    /** @type {string} */
    _jettonWalletAddress: string;
    mint: any;
    _getJettonWalletAddress(): Promise<string>;
    /**
     * Gets the information about a wallet.
     * @return {Promise<{ balance: string }>} The information data.
     */
    getInfo(): Promise<{
        balance: string;
    }>;
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<{
        mint: any;
        address: any;
        amount: any;
        decimals: number;
        transfer: boolean;
    }>;
    /**
     * @param {number} offset
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    getTransactions(offset: number, limit: number): Promise<any[]>;
    #private;
}
import { Token } from '../abstract/index.js';
