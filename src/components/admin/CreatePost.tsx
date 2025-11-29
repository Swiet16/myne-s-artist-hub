import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const CreatePost = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [postType, setPostType] = useState<'image' | 'video' | 'text'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a post');
      return;
    }

    setLoading(true);

    try {
      let finalMediaUrl = mediaUrl;

      if (postType === 'image' && imageFile) {
        finalMediaUrl = await handleImageUpload(imageFile);
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          title,
          description,
          post_type: postType,
          media_url: finalMediaUrl || null,
          posted_by: user.id,
        });

      if (error) throw error;

      toast.success('Post created successfully!');
      setTitle('');
      setDescription('');
      setMediaUrl('');
      setImageFile(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-brand-border bg-card">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Post Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            required
            className="bg-input border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter post description"
            rows={4}
            className="bg-input border-border resize-none"
          />
        </div>

        <div className="space-y-3">
          <Label>Post Type *</Label>
          <RadioGroup value={postType} onValueChange={(value: any) => setPostType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text" className="cursor-pointer">Text Post</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" />
              <Label htmlFor="image" className="cursor-pointer">Image Post</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="video" />
              <Label htmlFor="video" className="cursor-pointer">Video Post</Label>
            </div>
          </RadioGroup>
        </div>

        {postType === 'image' && (
          <div className="space-y-2">
            <Label htmlFor="image-file">Upload Image *</Label>
            <Input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              required
              className="bg-input border-border"
            />
          </div>
        )}

        {postType === 'video' && (
          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL (YouTube or direct link) *</Label>
            <Input
              id="video-url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              className="bg-input border-border"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Post'
          )}
        </Button>
      </form>
    </Card>
  );
};
