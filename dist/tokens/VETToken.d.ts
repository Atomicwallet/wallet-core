export default VETToken;
declare class VETToken extends Token {
    constructor(config: any, db: any, configManager: any);
    fee: string;
    get feeWallet(): this;
    getInfo(): Promise<{
        balance: string;
        transactions: import("../explorers/Transaction.js").default[];
    }>;
    getFee(): Promise<import("bn.js")>;
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<{
        contract: string;
        amount: string;
        dataToSend: string;
        fee: number;
    }>;
    sendTransaction(args: any): Promise<any>;
    isAvailableForFee(): Promise<boolean>;
    addLeadingZero(value: any, totalStringLength: any): string;
    #private;
}
import { Token } from '../abstract/index.js';
