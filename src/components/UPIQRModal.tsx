import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code'; // Ensure you have installed: npm i react-qr-code
import { Bill, Shop } from '@/types';
import { markBillAsPaid } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface UPIQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill;
  shop: Shop;
  onPaymentComplete: () => void; // <--- NEW PROP
}

export const UPIQRModal: React.FC<UPIQRModalProps> = ({ 
  open, 
  onOpenChange, 
  bill, 
  shop,
  onPaymentComplete 
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Generate UPI Link: upi://pay?pa=ADDRESS&pn=NAME&am=AMOUNT&tn=NOTE
  const upiLink = `upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.upiPayeeName || shop.shopName)}&am=${bill.totalAmount}&tn=Bill ${bill.billId.slice(0,8)}&cu=INR`;

  const handlePaymentReceived = async () => {
    setIsUpdating(true);
    try {
        // 1. Mark as Paid in Database
        await markBillAsPaid(bill.billId);
        
        toast({
            title: "Payment Confirmed",
            description: "Bill marked as PAID.",
            className: "bg-green-600 text-white border-none"
        });

        // 2. Refresh the Parent Page
        onPaymentComplete();
        
        // 3. Close Modal
        onOpenChange(false);
    } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle>Scan to Pay ₹{bill.totalAmount}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="p-4 bg-white rounded-xl border shadow-sm">
            <QRCode value={upiLink} size={200} />
          </div>
          <p className="text-sm text-muted-foreground">
            Paying to: <span className="font-semibold text-foreground">{shop.upiPayeeName || shop.upiId}</span>
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:gap-0">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
            onClick={handlePaymentReceived}
            disabled={isUpdating}
          >
            {isUpdating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Payment Received
                </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Click above after customer completes payment
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};