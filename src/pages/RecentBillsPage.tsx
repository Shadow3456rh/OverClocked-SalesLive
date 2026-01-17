import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Receipt, Clock, QrCode, Download, Loader2 } from 'lucide-react';
import { getBillsByStaff, getBillsByShop, getShopById } from '@/lib/storage';
import { Bill, Shop } from '@/types';
import { UPIQRModal } from '@/components/UPIQRModal';
import { exportBillToPDF } from '@/lib/pdfExport';

interface BillsListProps {
  isOwnerView?: boolean;
}

// Fallback shop object if data is missing
const DEFAULT_SHOP: Shop = {
    shopId: 'default',
    shopName: 'My Store',
    ownerId: '',
    createdAt: Date.now()
};

const BillActions: React.FC<{ bill: Bill; shop: Shop | undefined }> = ({ bill, shop }) => {
  const [qrOpen, setQrOpen] = useState(false);

  // Use the real shop or the fallback so PDF always works
  const activeShop = shop || DEFAULT_SHOP;
  
  const canShowQR = bill.syncStatus === 'SYNCED' && !!shop?.upiId;
  const missingUPI = bill.syncStatus === 'SYNCED' && !shop?.upiId;
  const isPending = bill.syncStatus === 'PENDING';

  const handleExportPDF = () => {
    exportBillToPDF(bill, activeShop);
  };

  return (
    <div className="flex items-center gap-2">
      {/* PDF Export - Always enabled */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download PDF</TooltipContent>
      </Tooltip>

      {/* UPI QR - Only enabled if UPI ID exists */}
      {canShowQR && shop && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQrOpen(true)}
              >
                <QrCode className="h-4 w-4 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>UPI QR</TooltipContent>
          </Tooltip>
          <UPIQRModal
            open={qrOpen}
            onOpenChange={setQrOpen}
            bill={bill}
            shop={shop}
          />
        </>
      )}

      {/* Disabled States for QR Button */}
      {(isPending || missingUPI) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-not-allowed opacity-50"
              disabled
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPending ? "Available after sync" : "Configure UPI in Dashboard"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

const BillsList: React.FC<{ bills: Bill[]; shop: Shop | undefined }> = ({ bills, shop }) => {
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No bills yet</h3>
        <p className="text-sm text-muted-foreground">
          Bills will appear here once created
        </p>
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
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Items</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
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
              <td className="px-4 py-4 text-sm text-muted-foreground">
                {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
              </td>
              <td className="px-4 py-4 text-right">
                <span className="text-sm font-semibold text-foreground">
                  ₹{bill.totalAmount.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    bill.syncStatus === 'SYNCED'
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                  }`}
                >
                  {bill.syncStatus === 'PENDING' && <Clock className="h-3 w-3" />}
                  {bill.syncStatus}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-muted-foreground">
                <div>{new Date(bill.createdAt).toLocaleDateString()}</div>
                <div className="text-xs">{new Date(bill.createdAt).toLocaleTimeString()}</div>
              </td>
              <td className="px-4 py-4 text-right">
                <BillActions bill={bill} shop={shop} />
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
  }, [user, isOwnerView]);

  if (!user) return null;

  const title = isOwnerView ? 'All Bills History' : 'Recent Bills';
  const description = isOwnerView 
    ? 'View all bills across your shop'
    : 'Your recent billing transactions';

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
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
             <BillsList bills={bills} shop={shop} />
           )}
        </CardContent>
      </Card>
    </div>
  );
};