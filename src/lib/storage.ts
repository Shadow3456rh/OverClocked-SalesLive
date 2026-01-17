import { User, Shop, Bill } from '@/types';
import { localDB } from './db';
import { db as firestore } from './firebase';
import { doc, setDoc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';

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

// --- STAFF INVITE LOGIC (THIS IS THE CRITICAL FUNCTION) ---
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
  // This is what the Google Login looks for!
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

// --- BILLS ---
export const createBill = async (billData: Omit<Bill, 'billId' | 'createdAt' | 'syncedAt' | 'syncStatus'>): Promise<Bill> => {
  const newBill: Bill = {
    ...billData,
    billId: generateId(),
    createdAt: Date.now(),
    syncedAt: null,
    syncStatus: 'PENDING',
  };
  await localDB.bills.add(newBill);
  syncPendingData();
  return newBill;
};

export const getBillsByShop = async (shopId: string): Promise<Bill[]> => {
  return await localDB.bills.where('shopId').equals(shopId).reverse().sortBy('createdAt');
};

export const getBillsByStaff = async (staffId: string): Promise<Bill[]> => {
    return await localDB.bills.where('staffId').equals(staffId).reverse().sortBy('createdAt');
};

export const getTodayBills = async (shopId: string): Promise<Bill[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
    result.push({
      date: dayStr,
      revenue: dayBills.reduce((sum, b) => sum + b.totalAmount, 0),
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