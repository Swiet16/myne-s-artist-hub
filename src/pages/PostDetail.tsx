import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { AuthDialog } from '@/components/AuthDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      fetchLikesCount();
      if (user) {
        checkIfLiked();
      }

      const likesChannel = supabase
        .channel(`post-likes-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'post_likes',
            filter: `post_id=eq.${id}`,
          },
          () => {
            fetchLikesCount();
            if (user) checkIfLiked();
          }
        )
        .subscribe();

      const commentsChannel = supabase
        .channel(`post-comments-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${id}`,
          },
          () => {
            fetchComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(likesChannel);
        supabase.removeChannel(commentsChannel);
      };
    }
  }, [id, user]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      navigate('/');
    } else {
      setPost(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (display_name, avatar_url)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
  };

  const fetchLikesCount = async () => {
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);
    setLikesCount(count || 0);
  };

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: id, user_id: user.id });
    }
  };

  const handleComment = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const commentData: any = {
      post_id: id,
      user_id: user.id,
      text: commentText,
      reply_to: replyTo,
    };

    if (isAdmin && replyTo) {
      commentData.is_official = true;
    }

    const { error } = await supabase
      .from('comments')
      .insert(commentData);

    if (error) {
      toast.error('Failed to post comment');
    } else {
      setCommentText('');
      setReplyTo(null);
      toast.success('Comment posted!');
    }
  };

  const renderMedia = () => {
    if (!post) return null;

    if (post.post_type === 'image' && post.media_url) {
      return (
        <img
          src={post.media_url}
          alt={post.title}
          className="w-full max-h-[600px] object-contain rounded-lg"
        />
      );
    }

    if (post.post_type === 'video' && post.media_url) {
      if (post.media_url.includes('youtube.com') || post.media_url.includes('youtu.be')) {
        const videoId = post.media_url.includes('youtu.be')
          ? post.media_url.split('youtu.be/')[1]
          : new URL(post.media_url).searchParams.get('v');
        
        return (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        );
      }
      
      return (
        <video
          src={post.media_url}
          controls
          className="w-full max-h-[600px] rounded-lg"
        />
      );
    }

    return null;
  };

  const renderComment = (comment: any, isReply = false) => {
    const displayName = comment.is_official 
      ? 'Myne Winner' 
      : comment.profiles?.display_name || 'Anonymous';

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12 mt-3' : 'mt-4'} ${
          comment.is_official ? 'bg-primary/10 border border-primary/30 rounded-lg p-4' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
            {displayName[0].toUpperCase()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{displayName}</span>
              {comment.is_official && (
                <div className="verified-badge">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <p className="mt-1 text-sm">{comment.text}</p>
            
            {isAdmin && !isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setReplyTo(comment.id)}
              >
                Reply as Myne Winner
              </Button>
            )}
          </div>
        </div>
        
        {/* Render replies */}
        {comments
          .filter(c => c.reply_to === comment.id)
          .map(reply => renderComment(reply, true))}
      </div>
    );
  };

  if (loading || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to posts
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media */}
          <div className="bg-card rounded-lg p-4 border border-brand-border">
            {renderMedia()}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
              {post.description && (
                <p className="text-muted-foreground">{post.description}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                variant={isLiked ? 'default' : 'secondary'}
                onClick={handleLike}
                className="gap-2"
              >
                <Heart className={isLiked ? 'fill-current' : ''} />
                {likesCount} Likes
              </Button>
              
              <Button variant="secondary" className="gap-2">
                <MessageCircle />
                {comments.filter(c => !c.reply_to).length} Comments
              </Button>
            </div>

            {/* Comments Section */}
            <Card className="p-4 border-brand-border bg-card">
              <h3 className="text-xl font-bold mb-4">Comments</h3>
              
              {/* Comment Input */}
              <div className="space-y-3">
                {replyTo && (
                  <div className="text-sm text-muted-foreground flex items-center justify-between bg-secondary p-2 rounded">
                    <span>Replying as official Myne Winner</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                
                <Textarea
                  placeholder={user ? "Write a comment..." : "Sign in to comment"}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="bg-input border-border resize-none"
                  rows={3}
                  disabled={!user}
                  onClick={() => !user && setAuthDialogOpen(true)}
                />
                
                <Button
                  onClick={handleComment}
                  disabled={!user || !commentText.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Post Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="mt-6 space-y-4">
                {comments
                  .filter(c => !c.reply_to)
                  .map(comment => renderComment(comment))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default PostDetail;
