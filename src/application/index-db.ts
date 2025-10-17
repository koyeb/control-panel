import * as idb from 'idb-keyval';

export class IndexDBAdapter {
  private store: idb.UseStore;

  constructor(dbName: string, storeName: string) {
    this.store = idb.createStore(dbName, storeName);
  }

  getItem(key: string) {
    return idb.get(key, this.store);
  }

  setItem(key: string, value: unknown) {
    return idb.set(key, value, this.store);
  }

  removeItem(key: string) {
    return idb.del(key, this.store);
  }

  clear() {
    return idb.clear(this.store);
  }

  entries() {
    return idb.entries<string>(this.store);
  }
}
