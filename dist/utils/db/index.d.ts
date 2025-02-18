import { Token } from '../../abstract/index.js';
import { NftToken } from '../../coins/nfts/index.js';
import Transaction from '../../explorers/Transaction.js';
import { dbTablesType, IDataBase, ITable, TableElement, TableElementKey, TableNames, TableTypes } from '../../utils/db/types.js';
import { IAddrCacheElement } from '../types.js';
export declare class BaseTable<T> implements ITable<T> {
    get(conditions: Partial<T>): Promise<Partial<T> | undefined>;
    getAll(conditions: Partial<T>): Promise<Partial<T>[]>;
    put(item: T): Promise<TableElementKey>;
    update(id: TableElementKey, changes: Partial<T>): Promise<TableElementKey>;
    delete(id: string): Promise<void>;
    batchDelete(ids: TableElementKey[]): Promise<void>;
    batchPut(items: T[]): Promise<TableElementKey | TableElementKey[]>;
    batchUpdate(ids: TableElementKey[], changes: Partial<T>): Promise<T[]>;
}
export declare class DataBase implements IDataBase {
    tables: dbTablesType;
    constructor(tables: dbTablesType);
    table<T extends TableNames>(dbTable: T): ITable<TableTypes[T]>;
}
export declare class BaseDatabase implements DataBase {
    tables: {
        transactions: ITable<Transaction>;
        tokens: ITable<Token>;
        addrCache: ITable<IAddrCacheElement>;
        nfts: ITable<NftToken>;
        sentNfts: ITable<NftToken>;
        configs: ITable<TableElement>;
    };
    constructor(tables?: dbTablesType);
    table<T extends TableNames>(dbTable: T): ITable<TableTypes[T]>;
}
export * from './types.js';
