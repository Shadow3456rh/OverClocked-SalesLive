// src/lib/db.ts
import Dexie, { Table } from 'dexie';
import { User, Shop, Bill, Product } from '@/types'; // Import Product

class SalesLiveDatabase extends Dexie {
  users!: Table<User>;
  shops!: Table<Shop>;
  bills!: Table<Bill>;
  products!: Table<Product>; // <--- NEW TABLE

  constructor() {
    super('SalesLiveDB');
    this.version(2).stores({
      users: 'userId, email, role, shopId',
      shops: 'shopId, ownerId',
      bills: 'billId, shopId, staffId, createdAt, syncStatus, [shopId+createdAt], [staffId+createdAt]',
      products: 'id, shopId' // <--- NEW SCHEMA
    });
  }
}

export const localDB = new SalesLiveDatabase();