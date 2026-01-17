import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, UserCheck, UserX, Loader2, Trash2 } from 'lucide-react';
// FIX: Import deleteStaff
import { getUsers, createStaffInvite, updateUser, deleteStaff } from '@/lib/storage';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const StaffManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [refresh, setRefresh] = useState(0);
  
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadStaff = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const allUsers = await getUsers();
        const staff = allUsers.filter(
          (u) => u.shopId === user.shopId && u.role === 'staff'
        );
        setStaffMembers(staff);
      } catch (error) {
        console.error("Failed to load staff", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStaff();
  }, [user, refresh]);

  if (!user) return null;

  const handleCreateStaff = async () => {
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
        await createStaffInvite(
            newStaffEmail, 
            newStaffName, 
            user.shopId,
            user.userId 
        );

        toast({
            title: 'Staff Invited',
            description: `${newStaffName} can now login via Google with ${newStaffEmail}`,
        });

        setNewStaffName('');
        setNewStaffEmail('');
        setIsDialogOpen(false);
        setRefresh((r) => r + 1);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to create invite.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const toggleStaffStatus = async (staff: User) => {
    await updateUser(staff.userId, { isActive: !staff.isActive });
    setRefresh((r) => r + 1);
  };

  // --- NEW DELETE HANDLER ---
  const handleDeleteStaff = async (staff: User) => {
    if(!confirm(`Are you sure you want to remove ${staff.name}? This cannot be undone.`)) return;

    try {
        await deleteStaff(staff.userId, staff.email);
        toast({ title: 'Staff Removed', description: 'User has been deleted from the system.' });
        setRefresh(r => r + 1);
    } catch(e) {
        toast({ title: 'Error', description: 'Could not delete staff.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand">
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="staffName">Name</Label>
                <Input
                  id="staffName"
                  placeholder="John Doe"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="input-focus mt-1"
                />
              </div>
              <div>
                <Label htmlFor="staffEmail">Google Email</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  placeholder="john@gmail.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="input-focus mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Staff must use this exact email to login with Google.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStaff} disabled={isSaving} className="gradient-brand">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send Invite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
             <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : staffMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No staff members yet</h3>
              <Button onClick={() => setIsDialogOpen(true)} className="gradient-brand mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add First Staff
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staffMembers.map((staff) => (
                <div key={staff.userId} className={`flex items-center gap-4 rounded-xl border p-4 ${!staff.isActive && 'opacity-50'}`}>
                  <div className="bg-primary/10 p-3 rounded-full">
                     <span className="font-bold text-primary">{staff.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{staff.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{staff.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleStaffStatus(staff)}>
                        {staff.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteStaff(staff)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};