import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Send, Smile, ImagePlus, Paperclip, Lock, Globe } from 'lucide-react';
import { Ticket } from '@/hooks/useTickets';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatBarProps {
  ticket: Ticket;
  onSent?: () => void;
}

export function ChatBar({ ticket, onSent }: ChatBarProps) {
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const canReply = !!ticket.reporter_email;

  const QUICK_EMOJIS = ['👍', '👎', '✅', '❌', '⚠️', '🔧', '📞', '💧', '🔥', '🏠'];

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      if (isPrivate) {
        // Private note
        await supabase.from('ticket_activities').insert({
          ticket_id: ticket.id,
          actor_id: user?.id || null,
          activity_type: 'comment',
          content: content.trim(),
          is_internal: true,
          metadata: { type: 'private_note' },
        });
        toast.success('Note privée ajoutée');
      } else {
        // Public reply
        if (!canReply) {
          toast.error('Aucun email de demandeur');
          return;
        }

        await supabase.from('ticket_activities').insert({
          ticket_id: ticket.id,
          actor_id: user?.id || null,
          activity_type: 'reply',
          content: content.trim(),
          metadata: { direction: 'outbound', sent_to: ticket.reporter_email },
        });

        // Record first_responded_at
        const ticketAny = ticket as any;
        if (!ticketAny.first_responded_at) {
          await supabase.from('tickets').update({ first_responded_at: new Date().toISOString() } as any).eq('id', ticket.id);
        }

        // Send email
        await supabase.functions.invoke('send-email', {
          body: {
            template: 'reply',
            to: [ticket.reporter_email],
            data: {
              ticketTitle: ticket.title,
              replyContent: content.trim(),
              replierName: user?.user_metadata?.full_name || "L'équipe support",
              ticketId: ticket.id,
            },
          },
        });
        toast.success('Réponse envoyée');
      }
      setContent('');
      onSent?.();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleFileClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = `${ticket.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('ticket-attachments').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('ticket-attachments').getPublicUrl(path);
      
      // Add as activity
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        actor_id: user?.id || null,
        activity_type: 'reply',
        content: `📎 ${file.name}`,
        metadata: { direction: 'outbound', attachment_url: urlData.publicUrl, file_name: file.name },
      });
      toast.success('Fichier envoyé');
      onSent?.();
    } catch {
      toast.error("Erreur d'upload");
    }
  };

  return (
    <div className="border-t bg-card p-3 space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          {isPrivate ? (
            <Lock className="h-3 w-3 text-yellow-600" />
          ) : (
            <Globe className="h-3 w-3 text-green-600" />
          )}
          <span className={isPrivate ? 'text-yellow-700 font-medium' : 'text-green-700 font-medium'}>
            {isPrivate ? 'Note interne' : 'Message public'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Privé</span>
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} className="scale-75" />
        </div>
      </div>

      {/* Emoji quick bar */}
      {showEmoji && (
        <div className="flex gap-1 flex-wrap">
          {QUICK_EMOJIS.map(e => (
            <button
              key={e}
              className="text-lg hover:scale-125 transition-transform p-0.5"
              onClick={() => setContent(prev => prev + e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleFileClick}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
        </div>

        <Textarea
          placeholder={isPrivate ? 'Écrire une note interne…' : `Répondre à ${ticket.reporter_name || ticket.reporter_email || 'Demandeur'}…`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="resize-none flex-1 min-h-[44px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          size="icon"
          className={`h-11 w-11 shrink-0 ${isPrivate ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
