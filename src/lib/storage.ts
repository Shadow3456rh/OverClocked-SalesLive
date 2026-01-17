import { User, Shop, Bill } from '@/types';
import { localDB } from './db';
import { db as firestore } from './firebase';
import { collection, doc, setDoc, getDocs, getDoc, query, where, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';

import { Product } from '@/types';
// --- UTILS ---
export const generateId = (): string => crypto.randomUUID();

// --- SYNC ENGINE ---
export const syncPendingData = async (): Promise<void> => {
  if (!navigator.onLine) return;
  try {
    const pendingBills = await localDB.bills.where('syncStatus').equals('PENDING').toArray();
    if (pendingBills.length === 0) return;

    const batch = writeBatch(firestore);
    pendingBills.forEach(bill => {
      const docRef = doc(firestore, 'bills', bill.billId);
      const billData = JSON.parse(JSON.stringify(bill));
      billData.syncStatus = 'SYNCED';
      billData.syncedAt = Date.now();
      batch.set(docRef, billData);
    });
    await batch.commit();

    const ids = pendingBills.map(b => b.billId);
    await localDB.bills.bulkUpdate(
      ids.map(id => ({ key: id, changes: { syncStatus: 'SYNCED', syncedAt: Date.now() } }))
    );
  } catch (error) {
    console.error("Sync failed:", error);
  }
};

// --- USER MANAGEMENT ---
export const saveUserLocally = async (user: User) => {
  await localDB.users.put(user);
};

export const getUserLocally = async (userId: string) => {
  return await localDB.users.get(userId);
};

export const getUsers = async (): Promise<User[]> => {
  return await localDB.users.toArray();
};

export const createUser = async (userData: Omit<User, 'userId' | 'createdAt'>): Promise<User> => {
  const newUser: User = {
    ...userData,
    userId: generateId(),
    createdAt: Date.now(),
  };
  await localDB.users.add(newUser);
  return newUser;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  await localDB.users.update(userId, updates);
  if(navigator.onLine) {
      try {
        await updateDoc(doc(firestore, 'users', userId), updates);
      } catch(e) { console.warn("Offline: User update saved locally only"); }
  }
};

// --- STAFF INVITE LOGIC ---
export const createStaffInvite = async (
  email: string, 
  name: string, 
  ownerShopId: string,
  ownerId: string
): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Create a placeholder in Local DB so Owner sees them in the list immediately
  const localStaff: User = {
    userId: `invite_${normalizedEmail}`, 
    name: name,
    email: normalizedEmail,
    role: 'staff',
    shopId: ownerShopId,
    isActive: true,
    createdAt: Date.now()
  };
  await localDB.users.put(localStaff);

  // 2. Create the "Invite Document" in Firestore
  if (navigator.onLine) {
    try {
      await setDoc(doc(firestore, 'invites', normalizedEmail), {
        email: normalizedEmail,
        shopId: ownerShopId,
        role: 'staff',
        name: name,
        invitedBy: ownerId,
        createdAt: Date.now(),
        status: 'pending'
      });
      console.log(`Invite successfully sent to cloud for ${normalizedEmail}`);
    } catch (e) {
      console.error("Failed to send invite to cloud:", e);
      throw e;
    }
  }
};
export const deleteStaff = async (userId: string, email: string): Promise<void> => {
  // 1. Delete from Local DB
  // We try to find the user locally first to ensure we delete the right key
  const localUser = await localDB.users.where('email').equals(email).first();
  if (localUser) {
      await localDB.users.delete(localUser.userId);
  } else {
      // Fallback: try deleting by the passed ID directly
      await localDB.users.delete(userId);
  }

  // 2. Delete from Firestore (User Profile + Invite)
  if (navigator.onLine) {
    try {
      // Delete the User Profile
      await deleteDoc(doc(firestore, 'users', userId));
      
      // Delete the Invite (so they can't re-login)
      await deleteDoc(doc(firestore, 'invites', email.toLowerCase()));
      
      console.log(`Staff ${email} deleted successfully.`);
    } catch (e) {
      console.error("Error deleting staff from cloud:", e);
      throw e;
    }
  }
};
// --- SHOPS ---
export const createShop = async (shopName: string, ownerId: string): Promise<Shop> => {
  const newShop: Shop = {
    shopId: generateId(),
    shopName,
    ownerId,
    createdAt: Date.now(),
  };
  await localDB.shops.put(newShop);
  if (navigator.onLine) {
    try { await setDoc(doc(firestore, 'shops', newShop.shopId), newShop); } 
    catch (e) {}
  }
  return newShop;
};

export const getShopById = async (shopId: string): Promise<Shop | undefined> => {
  let shop = await localDB.shops.get(shopId);
  if (!shop && navigator.onLine) {
    try {
      const shopDoc = await getDoc(doc(firestore, 'shops', shopId));
      if (shopDoc.exists()) {
        shop = shopDoc.data() as Shop;
        await localDB.shops.put(shop);
      }
    } catch (e) { console.error(e); }
  }
  return shop;
};

export const updateShop = async (shopId: string, updates: Partial<Shop>): Promise<void> => {
    const exists = await localDB.shops.get(shopId);
    if (exists) {
        await localDB.shops.update(shopId, updates);
    } else {
        const newShop: Shop = {
            shopId,
            shopName: 'My Store',
            ownerId: '', 
            createdAt: Date.now(),
            ...updates
        };
        await localDB.shops.put(newShop);
    }

    if(navigator.onLine) {
        try {
            await setDoc(doc(firestore, 'shops', shopId), updates, { merge: true });
        } catch(e) { console.warn("Offline update"); }
    }
};

// --- BILLS (NOW WITH CLOUD SYNC RESTORE) ---

export const createBill = async (
  // FIX: Added 'paymentStatus' to the Omit list here 👇
  billData: Omit<Bill, 'billId' | 'createdAt' | 'syncedAt' | 'syncStatus' | 'paymentStatus'>
): Promise<Bill> => {
  const newBill: Bill = {
    ...billData,
    billId: generateId(),
    createdAt: Date.now(),
    syncedAt: null,
    syncStatus: 'PENDING',
    paymentStatus: 'UNPAID', // <--- We set the default here automatically
  };
  
  await localDB.bills.add(newBill);
  syncPendingData();
  return newBill;
};
export const markBillAsPaid = async (billId: string): Promise<void> => {
  // 1. ALWAYS update Local DB first
  // CRITICAL: We set 'syncStatus' back to 'PENDING'. 
  // This tells our sync engine: "Hey, this bill changed! Upload it again next time we have internet."
  await localDB.bills.update(billId, { 
      paymentStatus: 'PAID',
      syncStatus: 'PENDING' 
  });
  
  // 2. Try Cloud Update Immediately (if Online)
  if (navigator.onLine) {
    try {
      await updateDoc(doc(firestore, 'bills', billId), { 
          paymentStatus: 'PAID',
          syncStatus: 'SYNCED', 
          syncedAt: Date.now()
      });
      
      // If cloud success, mark local as SYNCED immediately so we don't re-upload
      await localDB.bills.update(billId, { 
          syncStatus: 'SYNCED', 
          syncedAt: Date.now() 
      });
      
    } catch (e) {
      console.warn("Cloud update failed, queued for background sync.");
    }
  }
  
  // 3. Trigger background sync (Just in case we regained connection)
  syncPendingData();
};

// HELPER: Sync Down Bills if Local DB is empty
const syncBillsFromCloud = async (field: 'shopId' | 'staffId', value: string) => {
  if (!navigator.onLine) return;
  
  try {
    console.log(`Syncing bills from cloud for ${field}: ${value}...`);
    const q = query(collection(firestore, 'bills'), where(field, '==', value));
    const querySnapshot = await getDocs(q);
    
    const cloudBills: Bill[] = [];
    querySnapshot.forEach((doc) => {
      cloudBills.push(doc.data() as Bill);
    });

    if (cloudBills.length > 0) {
      // bulkPut adds new items and updates existing ones without duplication errors
      await localDB.bills.bulkPut(cloudBills); 
      console.log(`Restored ${cloudBills.length} bills from cloud.`);
    }
  } catch (e) {
    console.error("Error restoring bills from cloud:", e);
  }
};

export const getBillsByShop = async (shopId: string): Promise<Bill[]> => {
  // 1. Try Local DB first
  let bills = await localDB.bills
    .where('shopId').equals(shopId)
    .reverse()
    .sortBy('createdAt');

  // 2. If Local DB is empty but we are Online, Fetch from Cloud (Restore History)
  if (bills.length === 0 && navigator.onLine) {
    await syncBillsFromCloud('shopId', shopId);
    
    // 3. Re-fetch from Local DB after sync to include the new data
    bills = await localDB.bills
      .where('shopId').equals(shopId)
      .reverse()
      .sortBy('createdAt');
  }
  
  return bills;
};

export const getBillsByStaff = async (staffId: string): Promise<Bill[]> => {
  // 1. Try Local DB first
  let bills = await localDB.bills
    .where('staffId').equals(staffId)
    .reverse()
    .sortBy('createdAt');

  // 2. Sync down if empty
  if (bills.length === 0 && navigator.onLine) {
    await syncBillsFromCloud('staffId', staffId);
    
    // 3. Re-fetch
    bills = await localDB.bills
      .where('staffId').equals(staffId)
      .reverse()
      .sortBy('createdAt');
  }

  return bills;
};

export const getTodayBills = async (shopId: string): Promise<Bill[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Note: Dashboard usually calls 'getBillsByShop' first which triggers the sync,
  // so this function will have data available.
  return await localDB.bills
    .where('[shopId+createdAt]')
    .between([shopId, today.getTime()], [shopId, Date.now() + 1000])
    .toArray();
};

export const getBillsLast7Days = async (shopId: string) => {
  const endOfDay = new Date();
  const startOfPeriod = new Date();
  startOfPeriod.setDate(startOfPeriod.getDate() - 6);
  startOfPeriod.setHours(0,0,0,0);

  const bills = await localDB.bills
    .where('[shopId+createdAt]')
    .between([shopId, startOfPeriod.getTime()], [shopId, endOfDay.getTime()])
    .toArray();

  const result: { date: string; revenue: number; count: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
    const dayEnd = new Date(d.setHours(23,59,59,999)).getTime();
    
    const dayBills = bills.filter(b => b.createdAt >= dayStart && b.createdAt <= dayEnd);
    
    // ONLY SUM REVENUE IF PAID
    const revenue = dayBills.reduce((sum, b) => {
        return (b.paymentStatus === 'PAID') ? sum + b.totalAmount : sum;
    }, 0);
    
    result.push({
      date: dayStr,
      revenue,
      count: dayBills.length
    });
  }
  return result;
};

export const getTopSellingProducts = async (shopId: string, limit: number = 5) => {
  const bills = await localDB.bills.where('shopId').equals(shopId).toArray();
  const productMap = new Map<string, { qty: number; revenue: number }>();
  bills.forEach(bill => {
    bill.items.forEach(item => {
      const existing = productMap.get(item.name) || { qty: 0, revenue: 0 };
      productMap.set(item.name, {
        qty: existing.qty + item.qty,
        revenue: existing.revenue + item.lineTotal,
      });
    });
  });
  return Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};
// --- INVENTORY MANAGEMENT (NEW) ---

export const saveProduct = async (product: Product): Promise<void> => {
  try {
    // 1. Save Local
    await localDB.products.put(product);
    console.log("Product saved locally");

    // 2. Save Cloud (Sync)
    if (navigator.onLine) {
      await setDoc(doc(firestore, 'products', product.id), product);
      console.log("Product saved to cloud");
    }
  } catch (e) {
    console.error("Error saving product:", e);
    throw e;
  }
};

export const getProducts = async (shopId: string): Promise<Product[]> => {
  // 1. Try Local
  let products = await localDB.products.where('shopId').equals(shopId).toArray();

  // 2. If empty & Online, force fetch from Cloud
  if (products.length === 0 && navigator.onLine) {
    console.log("Fetching products from cloud...");
    try {
      const q = query(collection(firestore, 'products'), where('shopId', '==', shopId));
      const snapshot = await getDocs(q);
      
      const cloudProducts: Product[] = [];
      snapshot.forEach(doc => cloudProducts.push(doc.data() as Product));
      
      if (cloudProducts.length > 0) {
        await localDB.products.bulkPut(cloudProducts);
        products = cloudProducts;
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    }
  }
  return products;
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await localDB.products.delete(productId);
  if (navigator.onLine) {
    try {
      await deleteDoc(doc(firestore, 'products', productId));
    } catch (e) { console.error(e); }
  }
};