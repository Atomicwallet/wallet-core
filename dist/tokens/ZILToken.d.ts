export default ZILToken;
declare class ZILToken extends Token {
    createTransaction({ address, amount }: {
        address: any;
        amount: any;
    }): Promise<{
        address: any;
        amount: any;
        contract: string;
    }>;
}
import { Token } from '../abstract/index.js';
