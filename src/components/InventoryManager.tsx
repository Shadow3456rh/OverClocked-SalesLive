import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { saveProduct, getProducts, deleteProduct, generateId } from '@/lib/storage';
import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const InventoryManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [gst, setGst] = useState('');

  const loadProducts = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getProducts(user.shopId);
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => { loadProducts(); }, [user]);

  const handleSave = async () => {
    if (!name || !price) {
        toast({ title: "Missing fields", variant: "destructive" });
        return;
    }

    const product: Product = {
        id: editingId || generateId(),
        shopId: user!.shopId,
        name,
        price: parseFloat(price),
        gst: parseFloat(gst) || 0
    };

    await saveProduct(product);
    toast({ title: "Product Saved", description: `${name} updated in inventory.` });
    
    setIsOpen(false);
    resetForm();
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this item?")) return;
    await deleteProduct(id);
    loadProducts();
  };

  const openEdit = (p: Product) => {
      setEditingId(p.id);
      setName(p.name);
      setPrice(p.price.toString());
      setGst(p.gst.toString());
      setIsOpen(true);
  };

  const resetForm = () => {
      setEditingId(null);
      setName('');
      setPrice('');
      setGst('');
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Inventory
        </CardTitle>
        <Button size="sm" onClick={() => { resetForm(); setIsOpen(true); }} className="gradient-brand">
            <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 
         products.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No items added yet.</p> : 
         <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">₹{p.price} + {p.gst}% GST</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ))}
         </div>
        }

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Product</DialogTitle></DialogHeader>
                <div className="space-y-3">
                    <div><Label>Item Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Price (₹)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
                        <div><Label>GST (%)</Label><Input type="number" value={gst} onChange={e => setGst(e.target.value)} placeholder="0" /></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} className="gradient-brand">Save Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};