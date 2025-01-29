import { Token } from 'src/abstract';
import { NftToken } from 'src/coins/nfts';
import Transaction from 'src/explorers/Transaction';
import { IDataBase, ITable, TableElement, TableElementKey } from 'src/utils/db/types';

import { IAddrCacheElement } from '../types';

export class BaseTable<T> implements ITable<T> {
  async get(conditions: Partial<T>): Promise<Partial<T> | undefined> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve(undefined);
  }

  async getAll(conditions: Partial<T>): Promise<Partial<T>[]> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve([]);
  }

  async anyOf(conditions: Partial<T>, anyOf: T[]): Promise<T[]> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve([]);
  }

  async put(item: T): Promise<TableElementKey> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve('');
  }

  async update(id: TableElementKey, changes: Partial<T>): Promise<TableElementKey> {
    console.log('Base DB used, not implemented.');

    throw new Error('Not implemented.');
  }

  async delete(id: Pick<T, keyof T>): Promise<void> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve();
  }

  batchDelete(ids: TableElementKey[]): Promise<void> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve(undefined);
  }

  batchPut(items: T[]): Promise<TableElementKey[]> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve([]);
  }

  batchUpdate(ids: TableElementKey[], changes: Partial<T>): Promise<T[]> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve([]);
  }
}

export class BaseDatabase implements IDataBase {
  tables: {
    transactions: ITable<Transaction>;
    tokens: ITable<Token>;
    addrCache: ITable<IAddrCacheElement>;
    nfts: ITable<NftToken>;
    configs: ITable<TableElement>;
  };

  constructor() {
    this.tables = {
      transactions: new BaseTable<Transaction>(),
      tokens: new BaseTable<Token>(),
      addrCache: new BaseTable<IAddrCacheElement>(),
      nfts: new BaseTable<NftToken>(),
      configs: new BaseTable(),
    };
  }
}

export * from './types';
