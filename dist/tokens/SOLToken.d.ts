export default SOLToken;
declare class SOLToken extends Token {
    constructor(args: any);
    mint: any;
    loadAddress(): Promise<void>;
    set address(val: any);
    get address(): any;
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
    getTransactions(offset: any, limit: any): Promise<any>;
    #private;
}
import { Token } from '../abstract/index.js';
