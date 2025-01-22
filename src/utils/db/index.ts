import { Token } from 'src/abstract';
import Transaction from 'src/explorers/Transaction';
import { IDataBase, ITable, TableElement, TableElementKey } from 'src/utils/db/types';

export * from 'src/utils/db/types';

export class BaseTable<T> implements ITable<T> {
  async get(id: TableElementKey): Promise<Partial<T> | undefined> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve(undefined);
  }

  async getAll(): Promise<Partial<T>[]> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve([]);
  }

  async put(item: T): Promise<TableElementKey> {
    console.log('Base DB used, not implemented.');

    return Promise.resolve('');
  }

  async update(id: TableElementKey, changes: Partial<T>): Promise<T> {
    console.log('Base DB used, not implemented.');

    throw new Error('Not implemented.');
  }

  async delete(id: TableElementKey): Promise<void> {
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
    addrCache: ITable<TableElement>;
    configs: ITable<TableElement>;
    nfts: ITable<TableElement>;
  };

  constructor() {
    this.tables = {
      transactions: new BaseTable<Transaction>(),
      tokens: new BaseTable<Token>(),
      addrCache: new BaseTable(),
      configs: new BaseTable(),
      nfts: new BaseTable(),
    };
  }
}
