import { Coin, Token } from '../abstract/index.js';
import type Explorer from '../explorers/explorer.js';
export interface TransactionFields {
    id?: string;
    wallet?: Coin | Token;
    walletid?: string;
    explorer: Explorer | string;
    txid: string;
    direction: 'in' | 'out' | boolean;
    otherSideAddress: string;
    amount: string;
    memo?: string;
    datetime: Date | string;
    confirmations: number;
    alias?: string;
    ticker: string;
    timestamp?: number;
    recepient?: string;
    fee?: string;
}
export default class Transaction implements TransactionFields {
    wallet?: Coin | Token;
    walletid?: string;
    explorer: Explorer | string;
    txid: string;
    direction: 'in' | 'out' | boolean;
    otherSideAddress: string;
    amount: string;
    memo?: string;
    datetime: Date;
    confirmations: number;
    alias: string;
    ticker: string;
    timestamp: number;
    date: string;
    time: string;
    fee?: string;
    constructor(fields: TransactionFields);
    getDateTime(): Date;
    getDate(): string;
    getTime(): string;
    getStatus(): {
        text: string;
        color?: string;
    };
    getHash(): string;
    static fromHistory(fields: TransactionFields): Transaction;
}
