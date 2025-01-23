import { Token } from 'src/abstract';
import { NftToken } from 'src/coins/nfts';
import Transaction from 'src/explorers/Transaction';

import { IAddrCacheElement } from '../types';

export type TableElementKey = string | number;
export type TableElement = Record<string, unknown>;

export type TableNames = 'transactions' | 'tokens' | 'addrCache' | 'configs' | 'nfts';

export type TableTypes = {
  transactions: Transaction;
  tokens: Token;
  nfts: NftToken;
  addrCache: IAddrCacheElement; // @TODO implement typings instead unknown
  configs: TableElement;
};

export interface ITable<T> {
  get(id: TableElementKey): Promise<Partial<T> | undefined>;
  getAll(): Promise<Partial<T>[]>;
  put(item: T): Promise<TableElementKey>;
  update(id: TableElementKey, changes: Partial<T>): Promise<T>;
  delete(id: TableElementKey): Promise<void>;
  batchPut(items: T[]): Promise<TableElementKey[]>;
  batchDelete(ids: TableElementKey[]): Promise<void>;
  batchUpdate(ids: TableElementKey[], changes: Partial<T>): Promise<T[]>;
}

export interface IDataBase {
  tables: {
    [tableName in TableNames]: ITable<TableTypes[tableName]>;
  };
}
