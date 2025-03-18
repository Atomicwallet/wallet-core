export default class BNBToken extends Token {
    constructor(config: any, db: any, configManager: any);
    balances: {};
    getInfo(): Promise<{
        balance: string;
        transactions: import("../index.js").Transaction[];
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
