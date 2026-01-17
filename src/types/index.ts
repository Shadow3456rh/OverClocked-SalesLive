// User types

export type UserRole = 'owner' | 'staff';
export type PaymentStatus = 'PAID' | 'UNPAID'; // <--- NEW TYPE
export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  shopId: string;
  isActive: boolean;
  createdAt: number;
}
export interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  gst: number; // e.g., 18 for 18%
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
  paymentStatus: PaymentStatus; // <--- NEW FIELD
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
