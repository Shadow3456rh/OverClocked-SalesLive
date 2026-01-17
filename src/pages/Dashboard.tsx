import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Receipt, Clock, Users, Loader2 } from 'lucide-react';
import { 
    getTodayBills, 
    getBillsByShop, 
    getUserLocally, // Using the new async user getter
    getBillsLast7Days, 
    getTopSellingProducts 
} from '@/lib/storage';
import { Bill } from '@/types';
import { RevenueLineChart } from '@/components/charts/RevenueLineChart';
import { TopProductsChart } from '@/components/charts/TopProductsChart';
import { UPISettings } from '@/components/UPISettings';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'pending';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, description, variant = 'default' }) => {
  const iconColorClass = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    pending: 'text-accent',
  }[variant];

  const bgColorClass = {
    default: 'bg-primary/10',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    pending: 'bg-accent/10',
  }[variant];

  return (
    <Card className="kpi-card card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${bgColorClass}`}>
          <Icon className={`h-5 w-5 ${iconColorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const RecentBillsTable: React.FC<{ bills: Bill[] }> = ({ bills }) => {
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No bills yet</p>
        <p className="text-sm text-muted-foreground/70">Bills will appear here once created</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Bill ID</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Staff</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Time</th>
          </tr>
        </thead>
        <tbody>
          {bills.slice(0, 5).map((bill) => (
            <tr key={bill.billId} className="border-b border-border table-row-hover">
              <td className="px-4 py-3 text-sm font-mono text-foreground">
                {bill.billId.slice(0, 8)}...
              </td>
              <td className="px-4 py-3 text-sm text-foreground">{bill.staffName}</td>
              <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">
                ₹{bill.totalAmount.toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    bill.syncStatus === 'SYNCED'
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                  }`}
                >
                  {bill.syncStatus}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(bill.createdAt).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // State for async data
  const [loading, setLoading] = useState(true);
  const [todayBills, setTodayBills] = useState<Bill[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  
  // Effects to load data from IndexedDB
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch everything in parallel for speed
            const [today, all, revData, topProds] = await Promise.all([
                getTodayBills(user.shopId),
                getBillsByShop(user.shopId),
                getBillsLast7Days(user.shopId),
                getTopSellingProducts(user.shopId, 5)
            ]);

            setTodayBills(today);
            setAllBills(all);
            setRevenueData(revData);
            setTopProducts(topProds);
            
            // Calculate pending locally from the fetched bills
            setPendingSyncCount(all.filter(b => b.syncStatus === 'PENDING').length);

        } catch (err) {
            console.error("Dashboard data load error", err);
        } finally {
            setLoading(false);
        }
    };

    loadData();
  }, [user]);

  if (!user) return null;
  
  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
  }

  const todaySales = todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const isOwner = user.role === 'owner';

  // Calculate staff stats dynamically from bills
  // (We don't fetch all users locally to save time, we derive from bill history)
  const staffStats = isOwner ? Object.values(allBills.reduce((acc, bill) => {
      if (!acc[bill.staffId]) {
          acc[bill.staffId] = { name: bill.staffName, id: bill.staffId, count: 0, total: 0 };
      }
      acc[bill.staffId].count += 1;
      acc[bill.staffId].total += bill.totalAmount;
      return acc;
  }, {} as Record<string, {name: string, id: string, count: number, total: number}>)) : [];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isOwner ? 'Owner Dashboard' : 'Staff Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Sales"
          value={`₹${todaySales.toFixed(2)}`}
          icon={DollarSign}
          variant="success"
          description={`${todayBills.length} transactions`}
        />
        <KPICard
          title="Bills Today"
          value={todayBills.length}
          icon={Receipt}
          variant="default"
        />
        <KPICard
          title="Pending Sync"
          value={pendingSyncCount}
          icon={Clock}
          variant="warning"
          description="Waiting for connection"
        />
        {isOwner && (
          <KPICard
            title="Staff Active"
            value={staffStats.length}
            icon={Users}
            variant="default"
          />
        )}
      </div>

      {/* Owner Analytics Charts */}
      {isOwner && (
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueLineChart data={revenueData} />
          <TopProductsChart data={topProducts} />
        </div>
      )}

      {/* UPI Settings (Owner only) */}
      {isOwner && (
        <div className="grid gap-6 lg:grid-cols-2">
          <UPISettings shopId={user.shopId} />
        </div>
      )}

      {/* Staff Contributions (Owner only) */}
      {isOwner && staffStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staffStats.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {staff.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {staff.count} bills • ₹{staff.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Bills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentBillsTable bills={allBills.slice(0, 10)} />
        </CardContent>
      </Card>
    </div>
  );
};