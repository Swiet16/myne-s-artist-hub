import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePost } from '@/components/admin/CreatePost';
import { ManagePosts } from '@/components/admin/ManagePosts';
import { ManageComments } from '@/components/admin/ManageComments';
import { ManageUsers } from '@/components/admin/ManageUsers';
import { Loader2 } from 'lucide-react';

const Admin = () => {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage posts, comments, and users</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-card border border-brand-border">
            <TabsTrigger value="create">Create Post</TabsTrigger>
            <TabsTrigger value="posts">Manage Posts</TabsTrigger>
            <TabsTrigger value="comments">Manage Comments</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="users">Manage Users</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="create">
            <CreatePost />
          </TabsContent>

          <TabsContent value="posts">
            <ManagePosts />
          </TabsContent>

          <TabsContent value="comments">
            <ManageComments />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="users">
              <ManageUsers />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
