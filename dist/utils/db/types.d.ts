import { Token } from '../../abstract/index.js';
import { NftToken } from '../../coins/nfts/index.js';
import Transaction from '../../explorers/Transaction.js';
import { IAddrCacheElement } from '../types.js';
export type TableElementKey = string | string[] | number;
export type TableElement = Record<string, unknown>;
export type TableNames = 'transactions' | 'tokens' | 'addrCache' | 'nfts' | 'sentNfts' | 'configs';
export type TableTypes = {
    transactions: Transaction;
    tokens: Token;
    nfts: NftToken;
    sentNfts: NftToken;
    addrCache: IAddrCacheElement;
    configs: TableElement;
};
export interface ITable<T> {
    get(conditions: Partial<T>): Promise<Partial<T> | undefined>;
    getAll(conditions: Partial<T>): Promise<Partial<T>[]>;
    put(item: T): Promise<TableElementKey>;
    update(id: TableElementKey, changes: Partial<T>): Promise<TableElementKey>;
    delete(id: TableElementKey): Promise<void>;
    batchPut(items: T[]): Promise<TableElementKey | TableElementKey[]>;
    batchDelete(ids: TableElementKey[]): Promise<void>;
    batchUpdate(ids: TableElementKey[], changes: Partial<T>): Promise<T[]>;
}
export type dbTablesType = {
    [tableName in TableNames]: ITable<TableTypes[tableName]>;
};
export interface IDataBase {
    tables: Partial<dbTablesType>;
    table: <T extends TableNames>(dbTable: T) => ITable<TableTypes[T]>;
}
