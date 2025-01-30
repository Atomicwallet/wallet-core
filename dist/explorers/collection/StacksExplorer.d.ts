export default class StacksExplorer extends Explorer {
    constructor(...args: any[]);
    network: StacksMainnet;
    getInfo(address: any): Promise<{
        balance: number;
        nonce: any;
    }>;
    getTransactions({ address }: {
        address: any;
    }): Promise<import("../Transaction.js").default[]>;
    getNetwork(): StacksMainnet;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): 0 | 1;
    getTxFee(tx: any): any;
    getTxNonce(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
import { StacksMainnet } from '@stacks/network';
