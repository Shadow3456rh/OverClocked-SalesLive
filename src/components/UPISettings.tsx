import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Save, Check, Loader2 } from 'lucide-react';
import { getShopById, updateShop } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface UPISettingsProps {
  shopId: string;
}

export const UPISettings: React.FC<UPISettingsProps> = ({ shopId }) => {
  const { toast } = useToast();
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initShop = async () => {
        setIsLoading(true);
        try {
            let shop = await getShopById(shopId);
            
            // If shop doesn't exist, Create it automatically with defaults
            if (!shop) {
                console.log("Shop missing, creating default...");
                await updateShop(shopId, {
                    shopName: 'My SalesLive Store',
                    upiId: '',
                    upiPayeeName: ''
                });
                shop = await getShopById(shopId);
            }

            if (shop) {
                setUpiId(shop.upiId || '');
                setPayeeName(shop.upiPayeeName || shop.shopName);
            }
        } catch (e) {
            console.error("Error initializing shop settings", e);
        } finally {
            setIsLoading(false);
        }
    };
    initShop();
  }, [shopId]);

  const handleSave = async () => {
    // Allow saving empty UPI to just update the name
    await updateShop(shopId, {
      upiId: upiId.trim(),
      upiPayeeName: payeeName.trim() || undefined,
    });

    setSaved(true);
    toast({
      title: 'Settings Saved',
      description: 'Shop configuration updated successfully',
    });
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) {
      return (
          <Card>
              <CardContent className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Shop Payment Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="upiId">Shop UPI ID</Label>
          <Input
            id="upiId"
            placeholder="e.g. yourshop@oksbi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="input-focus mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Required for QR Code generation
          </p>
        </div>

        <div>
          <Label htmlFor="payeeName">Payee Display Name</Label>
          <Input
            id="payeeName"
            placeholder="Shop name displayed on UPI apps"
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            className="input-focus mt-1"
          />
        </div>

        <Button onClick={handleSave} className="w-full gradient-brand">
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};