import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Trash2, Receipt, RotateCcw, Loader2 } from 'lucide-react';
import { createBill, generateId } from '@/lib/storage'; // This is now the new engine
import { BillItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends Omit<BillItem, 'billId'> {
  tempId: string;
}

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [isSaving, setIsSaving] = useState(false); // New loading state

  if (!user) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = parseFloat(discount) || 0;
  const taxAmount = subtotal * ((parseFloat(taxRate) || 0) / 100);
  const total = subtotal - discountAmount + taxAmount;

  const addItem = () => {
    if (!itemName.trim() || !itemRate) {
      toast({
        title: 'Missing fields',
        description: 'Please enter item name and rate',
        variant: 'destructive',
      });
      return;
    }

    const rate = parseFloat(itemRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: 'Invalid rate',
        description: 'Please enter a valid rate',
        variant: 'destructive',
      });
      return;
    }

    const newItem: CartItem = {
      tempId: generateId(),
      itemId: generateId(),
      name: itemName.trim(),
      qty: itemQty,
      rate,
      lineTotal: itemQty * rate,
    };

    setCartItems([...cartItems, newItem]);
    setItemName('');
    setItemQty(1);
    setItemRate('');
  };

  const updateItemQty = (tempId: string, delta: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.tempId === tempId) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty, lineTotal: newQty * item.rate };
        }
        return item;
      })
    );
  };

  const removeItem = (tempId: string) => {
    setCartItems(cartItems.filter((item) => item.tempId !== tempId));
  };

  const clearAll = () => {
    setCartItems([]);
    setDiscount('');
    setTaxRate('');
  };

  const generateBill = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Empty cart',
        description: 'Please add items to generate a bill',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true); // Start loading

    try {
        const billId = generateId();
        const billItems: BillItem[] = cartItems.map((item) => ({
          itemId: item.itemId,
          billId,
          name: item.name,
          qty: item.qty,
          rate: item.rate,
          lineTotal: item.lineTotal,
        }));
    
        // Await the database operation
        await createBill({
          shopId: user.shopId,
          staffId: user.userId,
          staffName: user.name,
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          totalAmount: total,
          items: billItems,
        });
    
        toast({
          title: 'Bill Generated!',
          description: `Bill #${billId.slice(0, 8)} saved locally & syncing...`,
        });
    
        clearAll();
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error',
            description: 'Failed to save bill. Check console.',
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false); // Stop loading
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Bill</h1>
        <p className="text-muted-foreground">Create a new transaction</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Item Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                placeholder="Enter item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="input-focus mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{itemQty}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setItemQty(itemQty + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="itemRate">Rate ($)</Label>
                <Input
                  id="itemRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={itemRate}
                  onChange={(e) => setItemRate(e.target.value)}
                  className="input-focus mt-1"
                />
              </div>
            </div>

            <Button
              onClick={addItem}
              className="btn-billing w-full gradient-brand"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add to Bill
            </Button>
          </CardContent>
        </Card>

        {/* Cart & Totals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Bill Items</CardTitle>
            <span className="text-sm text-muted-foreground">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No items added yet</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.tempId}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.rate.toFixed(2)} × {item.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItemQty(item.tempId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.qty}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItemQty(item.tempId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="w-20 text-right font-semibold text-foreground">
                      ${item.lineTotal.toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.tempId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Discount & Tax */}
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <Label htmlFor="discount">Discount ($)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input-focus mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tax">Tax (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="input-focus mt-1"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-success">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">+${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span>Total</span>
                <span className="gradient-brand-text">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={clearAll}
                className="btn-billing"
                disabled={cartItems.length === 0 || isSaving}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Clear
              </Button>
              <Button
                onClick={generateBill}
                className="btn-billing gradient-brand"
                disabled={cartItems.length === 0 || isSaving}
              >
                {isSaving ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Receipt className="mr-2 h-5 w-5" />
                )}
                {isSaving ? 'Saving...' : 'Generate Bill'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};  