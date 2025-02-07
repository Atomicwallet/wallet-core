export default class ONTToken extends Token {
    constructor(config: any, db: any, configManageer: any);
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<{
        address: any;
        amount: any;
        asset: string;
    }>;
    sendTransaction(args: any): Promise<any>;
    sendRawTransaction(args: any): any;
    getFee(): any;
    get feeWallet(): this;
    isAvailableForFee(userFee: any): any;
    #private;
}
import { Token } from '../abstract/index.js';
