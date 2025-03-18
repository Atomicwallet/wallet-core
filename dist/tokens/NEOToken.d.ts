export default class NEOToken extends Token {
    constructor(config: any, db: any, configManager: any);
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<{
        address: any;
        amount: string;
        asset: string;
    }>;
    sendRawTransaction(args: any): any;
    getFee(): any;
    get feeWallet(): this;
    isAvailableForFee(userFee: any): any;
    #private;
}
import { Token } from '../abstract/index.js';
