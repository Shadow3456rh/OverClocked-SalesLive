import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Trash2, Receipt, Loader2, RefreshCw } from 'lucide-react';
import { createBill, generateId, getProducts } from '@/lib/storage'; // Import getProducts
import { BillItem, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends Omit<BillItem, 'billId'> {
  tempId: string;
}

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemName, setItemName] = useState(''); // Still needed for display/custom
  const [itemRate, setItemRate] = useState('');
  
  // Bill State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Inventory State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // 1. Fetch Products on Load
  useEffect(() => {
      if(user) {
          loadInventory();
      }
  }, [user]);

  const loadInventory = async () => {
      setIsLoadingProducts(true);
      try {
          if (user) {
             const data = await getProducts(user.shopId);
             setProducts(data);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingProducts(false);
      }
  };

  if (!user) return null;

  // 2. Handle Dropdown Change
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pId = e.target.value;
      setSelectedProductId(pId);

      if (pId === 'custom') {
          // Reset for manual entry
          setItemName('');
          setItemRate('');
          return;
      }

      const product = products.find(p => p.id === pId);
      if (product) {
          setItemName(product.name);
          setItemRate(product.price.toString());
          // Auto-fill GST if the product has it
          if (product.gst > 0) {
              setTaxRate(product.gst.toString());
          }
      }
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = parseFloat(discount) || 0;
  const taxAmount = subtotal * ((parseFloat(taxRate) || 0) / 100);
  const total = subtotal - discountAmount + taxAmount;

  const addItem = () => {
    // Allow item name from dropdown OR manual typing
    const finalName = itemName.trim();
    
    if (!finalName || !itemRate) {
      toast({ title: 'Missing fields', description: 'Select an item or enter details.', variant: 'destructive' });
      return;
    }

    const rate = parseFloat(itemRate);
    const newItem: CartItem = {
      tempId: generateId(),
      itemId: selectedProductId !== 'custom' ? selectedProductId : generateId(),
      name: finalName,
      qty: itemQty,
      rate,
      lineTotal: itemQty * rate,
    };

    setCartItems([...cartItems, newItem]);
    
    // Reset fields for next item
    setSelectedProductId('');
    setItemName('');
    setItemQty(1);
    setItemRate('');
  };

  const removeItem = (tempId: string) => {
    setCartItems(cartItems.filter((item) => item.tempId !== tempId));
  };

  const handleGenerateBill = async () => {
    if (cartItems.length === 0) return;
    setIsSaving(true);
    try {
      await createBill({
        shopId: user.shopId,
        staffId: user.userId,
        staffName: user.name,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        totalAmount: total,
        items: cartItems.map(({ tempId, ...rest }) => ({
           ...rest, 
           billId: '' 
        })),
      });

      toast({ title: 'Bill Created', description: `Total: ₹${total.toFixed(2)}` });
      // Reset Bill
      setCartItems([]);
      setDiscount('');
      setTaxRate('');
      setSelectedProductId('');
      setItemName('');
      setItemRate('');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to create bill', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ADD ITEM CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Add Item</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadInventory} disabled={isLoadingProducts}>
                <RefreshCw className={`h-4 w-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* 1. PRODUCT DROPDOWN (Replaces Manual Text Bar) */}
            <div>
                <Label htmlFor="productSelect">Select Product</Label>
                <div className="relative">
                    <select
                        id="productSelect"
                        value={selectedProductId}
                        onChange={handleProductChange}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    >
                        <option value="" disabled>-- Choose Item --</option>
                        {products.length > 0 ? (
                            products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — ₹{p.price}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>No inventory found</option>
                        )}
                        <option value="custom" className="font-bold text-primary">+ Add Custom Item Manually</option>
                    </select>
                    {/* Chevron Icon for styling */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                </div>
            </div>

            {/* If 'Custom' is selected, show the manual name input */}
            {selectedProductId === 'custom' && (
                <div className="animate-in fade-in slide-in-from-top-1">
                    <Label htmlFor="manualName">Item Name (Custom)</Label>
                    <Input 
                        id="manualName" 
                        value={itemName} 
                        onChange={e => setItemName(e.target.value)} 
                        placeholder="Enter item name"
                        className="mt-1"
                    />
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <Label>Quantity</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button type="button" variant="outline" size="icon" onClick={() => setItemQty(Math.max(1, itemQty - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{itemQty}</span>
                  <Button type="button" variant="outline" size="icon" onClick={() => setItemQty(itemQty + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Rate (Auto-filled but editable) */}
              <div>
                <Label htmlFor="itemRate">Rate (₹)</Label>
                <Input
                  id="itemRate"
                  type="number"
                  placeholder="0.00"
                  value={itemRate}
                  onChange={(e) => setItemRate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={addItem} className="w-full gradient-brand mt-2">
              <Plus className="mr-2 h-5 w-5" /> Add to Bill
            </Button>
          </CardContent>
        </Card>

        {/* BILL PREVIEW CARD */}
        <Card>
           <CardHeader>
             <CardTitle className="flex justify-between items-center">
                 <span>Current Bill</span>
                 <span className="text-sm font-normal text-muted-foreground">{cartItems.length} items</span>
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
               {cartItems.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                       Cart is empty
                   </div>
               ) : (
                   <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                       {cartItems.map(item => (
                           <div key={item.tempId} className="flex justify-between items-center bg-muted/30 p-2 rounded border">
                               <div>
                                   <div className="font-medium">{item.name}</div>
                                   <div className="text-xs text-muted-foreground">{item.qty} x ₹{item.rate}</div>
                               </div>
                               <div className="flex items-center gap-3">
                                   <span className="font-bold">₹{item.lineTotal}</span>
                                   <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.tempId)}>
                                       <Trash2 className="h-4 w-4" />
                                   </Button>
                               </div>
                           </div>
                       ))}
                   </div>
               )}

               {/* Tax & Discount Inputs */}
               <div className="grid grid-cols-2 gap-4 border-t pt-4">
                   <div>
                       <Label>Discount (₹)</Label>
                       <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                   </div>
                   <div>
                       <Label>GST (%)</Label>
                       <Input 
                            type="number" 
                            value={taxRate} 
                            onChange={e => setTaxRate(e.target.value)} 
                            placeholder="0" 
                       />
                       <p className="text-[10px] text-muted-foreground mt-1">
                          {taxRate ? `Applied to total` : 'Auto-filled from item'}
                       </p>
                   </div>
               </div>
               
               {/* Final Total */}
               <div className="flex justify-between items-center text-lg font-bold border-t pt-4 bg-muted/20 p-3 rounded-lg">
                   <span>Total Payable</span>
                   <span className="text-primary">₹{total.toFixed(2)}</span>
               </div>

               <Button 
                 className="w-full h-12 text-lg gradient-brand shadow-lg" 
                 disabled={cartItems.length === 0 || isSaving}
                 onClick={handleGenerateBill}
               >
                 {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Receipt className="mr-2" />}
                 Generate Bill
               </Button>
           </CardContent>
        </Card>
      </div>
    </div>
  );
};