export default TRXToken;
declare class TRXToken extends Token {
    createTransaction({ address, amount, userFee }: {
        address: any;
        amount: any;
        userFee: any;
    }): Promise<{
        address: any;
        amount: any;
        contract: string;
        transfer: boolean;
        userFee: any;
    }>;
}
import { Token } from '../abstract/index.js';
