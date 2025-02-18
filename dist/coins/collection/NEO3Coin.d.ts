export default NEO3Coin;
declare const NEO3Coin_base: {
    new (): {
        [x: string]: any;
        createTransaction({ address, amount, asset }: {
            address: any;
            amount: any;
            asset?: any;
        }): Promise<any>;
        sendTransaction(tx: any): Promise<{
            txid: any;
        }>;
        getInfo(): Promise<{
            balance: any;
            balances: any;
        }>;
        balance: any;
        balances: any;
        getFee({ sendAmount }?: {
            sendAmount?: string | undefined;
        }): Promise<string>;
    };
    [x: string]: any;
};
/**
 * class for NEO coin
 *
 * @class NEOCoin
 */
declare class NEO3Coin extends NEO3Coin_base {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        id: any;
    }, db: any, configManager: any);
    derivation: string;
    get feeWallet(): any;
    get feeTicker(): string;
    isAvailableForFee(userFee: any): Promise<any>;
    loadTokensList(wallets: any): Promise<void>;
    createToken(args: any): NEOToken;
    getTokenList(): {
        id: any;
        name: any;
        ticker: any;
        decimal: any;
        visibility: any;
    }[];
    getTokenTransactions(args: any): any;
    #private;
}
import { NEOToken } from '../../tokens/index.js';
