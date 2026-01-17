// src/lib/db.ts
import Dexie, { Table } from 'dexie';
import { User, Shop, Bill } from '@/types';

class SalesLiveDatabase extends Dexie {
  users!: Table<User>;
  shops!: Table<Shop>;
  bills!: Table<Bill>;

  constructor() {
    super('SalesLiveDB');
    this.version(1).stores({
      users: 'userId, email, role, shopId',
      shops: 'shopId, ownerId',
      // FIX: Added optimized indices for the new Bill queries
      bills: 'billId, shopId, staffId, createdAt, syncStatus, [shopId+createdAt], [staffId+createdAt]'
    });
  }
}

export const localDB = new SalesLiveDatabase();