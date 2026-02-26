import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Mic, Video, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  name: string;
  url: string;
  type: 'image' | 'audio' | 'video';
  storagePath: string;
}

interface MediaUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

const ACCEPT_MAP = {
  image: 'image/jpeg,image/png,image/webp,image/heic',
  audio: 'audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4',
  video: 'video/mp4,video/webm,video/quicktime',
};

const MAX_SIZE_MB = 20;

export function MediaUpload({ files, onFilesChange }: MediaUploadProps) {
  const { toast } = useToast();
  const imageRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, type: 'image' | 'audio' | 'video') => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux', description: `Maximum ${MAX_SIZE_MB} Mo`, variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('ticket-attachments')
        .upload(path, file, { contentType: file.type });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(path);

      onFilesChange([...files, {
        name: file.name,
        url: urlData.publicUrl,
        type,
        storagePath: path,
      }]);
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Erreur d\'upload', description: 'Impossible d\'envoyer le fichier', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (type: 'image' | 'audio' | 'video') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file, type);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => imageRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
          Photo
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => audioRef.current?.click()} disabled={uploading}>
          <Mic className="h-4 w-4 mr-1" /> Audio
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => videoRef.current?.click()} disabled={uploading}>
          <Video className="h-4 w-4 mr-1" /> Vidéo
        </Button>

        <input ref={imageRef} type="file" accept={ACCEPT_MAP.image} className="hidden" onChange={handleFileChange('image')} />
        <input ref={audioRef} type="file" accept={ACCEPT_MAP.audio} className="hidden" onChange={handleFileChange('audio')} />
        <input ref={videoRef} type="file" accept={ACCEPT_MAP.video} className="hidden" onChange={handleFileChange('video')} />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative rounded-md border border-border overflow-hidden bg-muted">
              {f.type === 'image' && (
                <img src={f.url} alt={f.name} className="w-full h-24 object-cover" />
              )}
              {f.type === 'audio' && (
                <div className="flex items-center justify-center h-24 p-2">
                  <audio controls src={f.url} className="w-full h-8" />
                </div>
              )}
              {f.type === 'video' && (
                <video src={f.url} controls className="w-full h-24 object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="px-1 py-0.5 text-xs truncate">{f.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
