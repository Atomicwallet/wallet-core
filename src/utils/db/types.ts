import { Token } from 'src/abstract';
import Transaction from 'src/explorers/Transaction';

export type TableElementKey = string | number;
export type TableElement = Record<string, unknown>;

export type TableNames = 'transactions' | 'tokens' | 'addrCache' | 'configs' | 'nfts';

export type TableTypes = {
  transactions: Transaction;
  tokens: Token;
  addrCache: TableElement; // @TODO implement typings instead unknown
  configs: TableElement;
  nfts: TableElement;
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
