import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { AuthDialog } from '@/components/AuthDialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Gallery = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'text'>('all');

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(post => post.post_type === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-16">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 text-center">
          <span className="text-gradient">GALLERY</span>
        </h1>
        
        <Tabs defaultValue="all" className="mb-8" onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              {filter === 'all' ? 'No posts yet' : `No ${filter} posts yet`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onAuthRequired={() => setAuthDialogOpen(true)}
              />
            ))}
          </div>
        )}
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default Gallery;
