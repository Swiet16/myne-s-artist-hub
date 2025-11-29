import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ManagePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_likes(count),
        comments(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch posts');
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast.error('Failed to delete post');
    } else {
      toast.success('Post deleted successfully');
      fetchPosts();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  return (
    <Card className="p-6 border-brand-border bg-card">
      <h2 className="text-2xl font-bold mb-6">Manage Posts</h2>
      
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No posts yet</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border border-border rounded-lg p-4 bg-secondary/50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{post.title}</h3>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.post_likes?.[0]?.count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments?.[0]?.count || 0}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
