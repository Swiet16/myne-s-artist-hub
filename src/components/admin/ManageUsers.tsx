import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, User } from 'lucide-react';

export const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role)
      `);

    if (error) {
      toast.error('Failed to fetch users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, currentRole: string, newRole: 'user' | 'admin' | 'super_admin') => {
    // Delete old role if it exists
    if (currentRole && currentRole !== 'user') {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', currentRole as 'user' | 'admin' | 'super_admin');
    }

    // Delete default user role if changing to admin/super_admin
    if (currentRole === 'user' && newRole !== 'user') {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'user');
    }

    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role: newRole }]);

    if (error) {
      toast.error('Failed to update user role');
    } else {
      toast.success('User role updated successfully');
      fetchUsers();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <Card className="p-6 border-brand-border bg-card">
      <h2 className="text-2xl font-bold mb-6">Manage Users</h2>
      
      <div className="space-y-4">
        {users.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No users yet</p>
        ) : (
          users.map((user) => {
            const currentRole = user.user_roles?.[0]?.role || 'user';
            
            return (
              <div
                key={user.id}
                className="border border-border rounded-lg p-4 bg-secondary/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {currentRole === 'super_admin' ? (
                      <Shield className="w-5 h-5 text-primary" />
                    ) : currentRole === 'admin' ? (
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div>
                    <p className="font-semibold">{user.display_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                <Select
                  value={currentRole}
                  onValueChange={(newRole) => updateUserRole(user.id, currentRole, newRole as 'user' | 'admin' | 'super_admin')}
                >
                  <SelectTrigger className="w-[180px] bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
