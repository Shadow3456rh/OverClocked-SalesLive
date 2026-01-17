import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
// ADDED: Banknote, CheckCircle, XCircle icons
import { Receipt, Clock, QrCode, Download, Loader2, Banknote, CheckCircle, XCircle } from 'lucide-react';
// ADDED: markBillAsPaid import
import { getBillsByStaff, getBillsByShop, getShopById, markBillAsPaid } from '@/lib/storage';
import { Bill, Shop } from '@/types';
import { UPIQRModal } from '@/components/UPIQRModal';
import { exportBillToPDF } from '@/lib/pdfExport';
import { useToast } from '@/hooks/use-toast'; // Added toast

interface BillsListProps {
  isOwnerView?: boolean;
}

const DEFAULT_SHOP: Shop = {
    shopId: 'default',
    shopName: 'My Store',
    ownerId: '',
    createdAt: Date.now()
};

// MODIFIED: BillActions now takes a refresh callback
const BillActions: React.FC<{ bill: Bill; shop: Shop | undefined; onUpdate: () => void }> = ({ bill, shop, onUpdate }) => {
  const [qrOpen, setQrOpen] = useState(false);
  const { toast } = useToast();

  const activeShop = shop || DEFAULT_SHOP;
  const isPaid = bill.paymentStatus === 'PAID';

  const handleExportPDF = () => {
    exportBillToPDF(bill, activeShop);
  };

  const handleMarkPaid = async () => {
      await markBillAsPaid(bill.billId);
      toast({ title: "Payment Received", description: "Bill marked as paid successfully." });
      onUpdate(); // Trigger refresh of the list
  };

  return (
    <div className="flex items-center justify-end gap-3">
      {/* 1. STATUS TEXT */}
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border ${
          isPaid 
            ? 'text-green-600 border-green-200 bg-green-50' 
            : 'text-red-600 border-red-200 bg-red-50'
      }`}>
          {isPaid ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Complete</span>
              </>
          ) : (
              <>
                <XCircle className="h-3 w-3" />
                <span>Incomplete</span>
              </>
          )}
      </div>

      <div className="flex items-center gap-1">
        {/* 2. MARK PAID BUTTON (Only if Unpaid) */}
        {!isPaid && (
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={handleMarkPaid}
                >
                    <Banknote className="h-4 w-4" />
                </Button>
                </TooltipTrigger>
                <TooltipContent>Mark Payment Received (Cash)</TooltipContent>
            </Tooltip>
        )}

        {/* 3. PDF Export */}
        <Tooltip>
            <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportPDF}>
                <Download className="h-4 w-4" />
            </Button>
            </TooltipTrigger>
            <TooltipContent>Download PDF</TooltipContent>
        </Tooltip>

        {/* 4. UPI QR */}
        {bill.syncStatus === 'SYNCED' && shop?.upiId && !isPaid && (
          <>
          <Tooltip>
              <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQrOpen(true)}>
                  <QrCode className="h-4 w-4 text-primary" />
              </Button>
              </TooltipTrigger>
              <TooltipContent>UPI QR</TooltipContent>
          </Tooltip>
          
          {/* PASS THE onUpdate FUNCTION HERE 👇 */}
          <UPIQRModal 
              open={qrOpen} 
              onOpenChange={setQrOpen} 
              bill={bill} 
              shop={shop} 
              onPaymentComplete={onUpdate} 
          />
          </>
      )}
      </div>
    </div>
  );
};

const BillsList: React.FC<{ bills: Bill[]; shop: Shop | undefined; onUpdate: () => void }> = ({ bills, shop, onUpdate }) => {
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No bills yet</h3>
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
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sync</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Payment & Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.billId} className="border-b border-border table-row-hover">
              <td className="px-4 py-4">
                <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                  {bill.billId.slice(0, 8)}
                </code>
              </td>
              <td className="px-4 py-4 text-sm text-foreground">{bill.staffName}</td>
              <td className="px-4 py-4 text-right">
                <span className="text-sm font-semibold text-foreground">
                  ₹{bill.totalAmount.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    bill.syncStatus === 'SYNCED' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {bill.syncStatus}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-muted-foreground">
                <div>{new Date(bill.createdAt).toLocaleDateString()}</div>
                <div className="text-xs">{new Date(bill.createdAt).toLocaleTimeString()}</div>
              </td>
              <td className="px-4 py-4 text-right">
                {/* Pass onUpdate to allow refreshing the list after payment */}
                <BillActions bill={bill} shop={shop} onUpdate={onUpdate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const RecentBillsPage: React.FC<BillsListProps> = ({ isOwnerView = false }) => {
  const { user } = useAuth();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [shop, setShop] = useState<Shop | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for re-fetching

  useEffect(() => {
    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const fetchedBills = isOwnerView 
                ? await getBillsByShop(user.shopId)
                : await getBillsByStaff(user.userId);
            
            const fetchedShop = await getShopById(user.shopId);
            const sorted = [...fetchedBills].sort((a, b) => b.createdAt - a.createdAt);
            
            setBills(sorted);
            setShop(fetchedShop);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, [user, isOwnerView, refreshTrigger]); // Add refreshTrigger to dependencies

  if (!user) return null;

  const title = isOwnerView ? 'All Bills History' : 'Recent Bills';

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">Manage payments and view history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Bills</span>
            <span className="text-sm font-normal text-muted-foreground">
              {bills.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
           {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
           ) : (
             <BillsList 
                bills={bills} 
                shop={shop} 
                onUpdate={() => setRefreshTrigger(r => r + 1)} 
             />
           )}
        </CardContent>
      </Card>
    </div>
  );
};