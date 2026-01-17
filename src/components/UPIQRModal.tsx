// src/components/UPIQRModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from 'qrcode.react';
import { Bill, Shop } from '@/types';

interface UPIQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill;
  shop: Shop;
}

export const UPIQRModal: React.FC<UPIQRModalProps> = ({
  open,
  onOpenChange,
  bill,
  shop,
}) => {
  // Construct the UPI payment string dynamically
  // pa = payee address (UPI ID), pn = payee name, am = amount, cu = currency
  const upiString = `upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.upiPayeeName || shop.shopName)}&am=${bill.totalAmount.toFixed(2)}&cu=INR`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan to Pay</DialogTitle>
          <DialogDescription>
            Scan this QR code with any UPI app to pay ₹{bill.totalAmount.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-6">
          <div className="rounded-xl border-4 border-primary/20 p-4 bg-white">
            <QRCodeSVG
              value={upiString}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"} // High error correction for better scanning
              includeMargin={false}
            />
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Paying to: <span className="font-medium text-foreground">{shop.upiPayeeName || shop.shopName}</span>
          <br />
          UPI ID: {shop.upiId}
        </div>
      </DialogContent>
    </Dialog>
  );
};