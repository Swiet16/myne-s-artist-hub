import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  title: string;
  description: string | null;
  post_type: string;
  media_url: string | null;
  created_at: string;
}

interface PostCardProps {
  post: Post;
  onAuthRequired: () => void;
}

export const PostCard = ({ post, onAuthRequired }: PostCardProps) => {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    fetchLikesCount();
    fetchCommentsCount();
    if (user) {
      checkIfLiked();
    }

    const likesChannel = supabase
      .channel(`post-likes-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${post.id}`,
        },
        () => {
          fetchLikesCount();
          if (user) {
            checkIfLiked();
          }
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel(`post-comments-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${post.id}`,
        },
        () => {
          fetchCommentsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [post.id, user]);

  const fetchLikesCount = async () => {
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    setLikesCount(count || 0);
  };

  const fetchCommentsCount = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    setCommentsCount(count || 0);
  };

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    setLiking(true);

    if (isLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to unlike post');
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: user.id });

      if (error) {
        toast.error('Failed to like post');
      }
    }

    setLiking(false);
  };

  const renderMedia = () => {
    if (post.post_type === 'image' && post.media_url) {
      return (
        <div className="aspect-square overflow-hidden bg-secondary rounded-t-lg">
          <img
            src={post.media_url}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      );
    }

    if (post.post_type === 'video' && post.media_url) {
      if (post.media_url.includes('youtube.com') || post.media_url.includes('youtu.be')) {
        const videoId = post.media_url.includes('youtu.be')
          ? post.media_url.split('youtu.be/')[1]
          : new URL(post.media_url).searchParams.get('v');
        
        return (
          <div className="aspect-video bg-secondary rounded-t-lg">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full rounded-t-lg"
              allowFullScreen
            />
          </div>
        );
      }
      
      return (
        <div className="aspect-video bg-secondary rounded-t-lg">
          <video
            src={post.media_url}
            controls
            className="w-full h-full rounded-t-lg"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Link to={`/post/${post.id}`}>
      <Card className="overflow-hidden border-brand-border bg-card hover-lift cursor-pointer group">
        {renderMedia()}
        
        <div className="p-4 space-y-3">
          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          
          {post.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.description}
            </p>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${isLiked ? 'text-primary' : ''}`}
                onClick={handleLike}
                disabled={liking}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                {commentsCount}
              </div>
            </div>
            
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
