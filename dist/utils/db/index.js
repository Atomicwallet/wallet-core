export class BaseTable {
    async get(conditions) {
        console.log('Base DB used, `get` not implemented.');
        return Promise.resolve(undefined);
    }
    async getAll(conditions) {
        console.log('Base DB used, `getAll` not implemented.');
        return Promise.resolve([]);
    }
    async put(item) {
        console.log('Base DB used, `put` not implemented.');
        return Promise.resolve('');
    }
    async update(id, changes) {
        console.log('Base DB used, `update` not implemented.');
        return Promise.reject(new Error('Not implemented.'));
    }
    async delete(id) {
        console.log('Base DB used, `delete` not implemented.');
        return Promise.resolve();
    }
    batchDelete(ids) {
        console.log('Base DB used, `batchDelete` not implemented.');
        return Promise.resolve(undefined);
    }
    batchPut(items) {
        console.log('Base DB used, `batchPut` not implemented.');
        return Promise.reject(new Error('Not implemented.'));
    }
    batchUpdate(ids, changes) {
        console.log('Base DB used, `batchUpdate` not implemented.');
        return Promise.resolve([]);
    }
}
export class DataBase {
    constructor(tables) {
        this.tables = tables;
    }
    table(dbTable) {
        return this.tables[dbTable];
    }
}
export class BaseDatabase {
    constructor(tables) {
        this.tables = {
            transactions: new BaseTable(),
            tokens: new BaseTable(),
            addrCache: new BaseTable(),
            nfts: new BaseTable(),
            sentNfts: new BaseTable(),
            configs: new BaseTable(),
        };
    }
    table(dbTable) {
        return this.tables[dbTable];
    }
}
export * from './types.js';
//# sourceMappingURL=index.js.map