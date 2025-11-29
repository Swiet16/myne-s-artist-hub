import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ManageComments = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    const { data: commentsData, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch comments');
      setLoading(false);
      return;
    }

    // Fetch profiles and posts separately
    const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
    const postIds = [...new Set(commentsData?.map(c => c.post_id) || [])];

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const { data: postsData } = await supabase
      .from('posts')
      .select('id, title')
      .in('id', postIds);

    // Merge data
    const commentsWithDetails = commentsData?.map(comment => ({
      ...comment,
      profiles: profilesData?.find(p => p.id === comment.user_id),
      posts: postsData?.find(p => p.id === comment.post_id)
    }));

    setComments(commentsWithDetails || []);
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('Failed to delete comment');
    } else {
      toast.success('Comment deleted successfully');
      fetchComments();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading comments...</div>;
  }

  return (
    <Card className="p-6 border-brand-border bg-card">
      <h2 className="text-2xl font-bold mb-6">Manage Comments</h2>
      
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`border border-border rounded-lg p-4 ${
                comment.is_official ? 'bg-primary/10 border-primary/30' : 'bg-secondary/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">
                      {comment.is_official ? 'Myne Winner' : comment.profiles?.display_name}
                    </span>
                    {comment.is_official && (
                      <div className="verified-badge">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm mb-2">{comment.text}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>on: {comment.posts?.title}</span>
                    <span>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(comment.id)}
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
