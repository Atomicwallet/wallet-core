export default class BNBToken extends Token {
    constructor(args: any);
    balances: {};
    getInfo(): Promise<{
        balance: string;
        transactions: import("../explorers/Transaction.js").default[];
    }>;
    createTransaction({ address, amount, memo }: {
        address: any;
        amount: any;
        memo: any;
    }): Promise<{
        address: any;
        amount: any;
        memo: any;
        asset: string;
    }>;
    getBalance(): Promise<string | null>;
    getUserTicker(): string | undefined;
}
import { Token } from '../abstract/index.js';
