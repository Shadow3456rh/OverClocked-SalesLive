// User types
export type UserRole = 'owner' | 'staff';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  shopId: string;
  isActive: boolean;
  createdAt: number;
}

export interface Shop {
  shopId: string;
  shopName: string;
  ownerId: string;
  createdAt: number;
  upiId?: string;
  upiPayeeName?: string;
}

// Bill types
export type SyncStatus = 'PENDING' | 'SYNCED';

export interface BillItem {
  itemId: string;
  billId: string;
  name: string;
  qty: number;
  rate: number;
  lineTotal: number;
}

export interface Bill {
  billId: string;
  shopId: string;
  staffId: string;
  staffName: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  createdAt: number;
  syncedAt: number | null;
  syncStatus: SyncStatus;
  items: BillItem[];
}

// Session
export interface Session {
  user: User;
  isLoggedIn: boolean;
}

// Dashboard KPIs
export interface DashboardKPIs {
  todaySales: number;
  billsToday: number;
  pendingSync: number;
}
