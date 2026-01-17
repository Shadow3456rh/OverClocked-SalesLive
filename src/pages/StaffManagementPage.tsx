import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, UserCheck, UserX, Loader2 } from 'lucide-react';
import { getUsers, createUser, updateUser } from '@/lib/storage';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const StaffManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [refresh, setRefresh] = useState(0);
  
  // New State for Async Data
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Staff Async
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
      toast({
        title: 'Missing fields',
        description: 'Please enter name and email',
        variant: 'destructive',
      });
      return;
    }

    // Check if email already exists locally
    const allUsers = await getUsers();
    const existingUser = allUsers.find(
      (u) => u.email.toLowerCase() === newStaffEmail.toLowerCase()
    );
    
    if (existingUser) {
      toast({
        title: 'Email exists',
        description: 'A user with this email already exists',
        variant: 'destructive',
      });
      return;
    }

    await createUser({
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: 'staff',
      shopId: user.shopId,
      isActive: true,
    });

    toast({
      title: 'Staff created',
      description: `${newStaffName} has been added to your team`,
    });

    setNewStaffName('');
    setNewStaffEmail('');
    setIsDialogOpen(false);
    setRefresh((r) => r + 1); // Trigger reload
  };

  const toggleStaffStatus = async (staff: User) => {
    await updateUser(staff.userId, { isActive: !staff.isActive });
    toast({
      title: staff.isActive ? 'Staff disabled' : 'Staff enabled',
      description: `${staff.name} has been ${staff.isActive ? 'disabled' : 'enabled'}`,
    });
    setRefresh((r) => r + 1); // Trigger reload
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
              <DialogTitle>Add New Staff Member</DialogTitle>
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
                <Label htmlFor="staffEmail">Email</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="input-focus mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                New staff can login with any password (demo mode)
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStaff} className="gradient-brand">
                Create Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Team Members</span>
            <span className="text-sm font-normal text-muted-foreground">
              {staffMembers.length} staff
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : staffMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No staff members yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first staff member to get started
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="gradient-brand"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Staff
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staffMembers.map((staff) => (
                <div
                  key={staff.userId}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    staff.isActive
                      ? 'border-border bg-card'
                      : 'border-destructive/20 bg-destructive/5'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      staff.isActive ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`text-lg font-bold ${
                        staff.isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {staff.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{staff.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{staff.email}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${
                        staff.isActive
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {staff.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3" />
                          Disabled
                        </>
                      )}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStaffStatus(staff)}
                    className={
                      staff.isActive
                        ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20'
                        : 'hover:bg-success/10 hover:text-success hover:border-success/20'
                    }
                  >
                    {staff.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};