export default DoraExplorer;
declare class DoraExplorer extends Explorer {
    constructor(config: any);
    ticker: any;
    height: number;
    getInitParams(): {
        headers: {
            'X-Referer': string;
        };
        constructor: Function;
        toString(): string;
        toLocaleString(): string;
        valueOf(): Object;
        hasOwnProperty(v: PropertyKey): boolean;
        isPrototypeOf(v: Object): boolean;
        propertyIsEnumerable(v: PropertyKey): boolean;
    };
    getInfo(address: any): Promise<{
        balance: undefined;
        balances: {
            NEO: string;
            GAS: string;
        };
    }>;
    getTransactions({ address }: {
        address: any;
    }): Promise<any[]>;
    modifyTransactionsResponse(response: any, selfAddress: any): any[];
    getTxConfirmations(tx: any): number;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
}
import Explorer from '../../explorers/explorer.js';
