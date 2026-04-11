import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { 
  AlertCircle, CheckCircle, Clock, Pause, XCircle, 
  Calendar, MapPin, Tag, User, Phone, Mail, 
  Image, Mic, Video, Paperclip, QrCode, Send, MessageSquare
} from 'lucide-react';
import { Ticket, useTicketActivities, TicketActivity } from '@/hooks/useTickets';
import { TICKET_STATUSES, TICKET_PRIORITIES, formatTicketDisplayTitle } from '@/utils/ticketUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { sendEmail } from '@/services/notifications';
import { addTicketActivity } from '@/services/tickets';
import { createLogger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const log = createLogger('component:ticket-detail-dialog');

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open': return <AlertCircle className="h-4 w-4" />;
    case 'in_progress': return <Clock className="h-4 w-4" />;
    case 'waiting': return <Pause className="h-4 w-4" />;
    case 'resolved': return <CheckCircle className="h-4 w-4" />;
    case 'closed': return <CheckCircle className="h-4 w-4" />;
    case 'canceled': return <XCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800 border-red-200';
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
    case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getMediaIcon = (type: string) => {
  if (type === 'image') return <Image className="h-4 w-4" />;
  if (type === 'audio') return <Mic className="h-4 w-4" />;
  if (type === 'video') return <Video className="h-4 w-4" />;
  return <Paperclip className="h-4 w-4" />;
};

function ConversationThread({ ticket, ticketId }: { ticket: Ticket; ticketId: string }) {
  const { activities, loading } = useTicketActivities(ticketId);

  const replyActivities = (activities || [])
    .filter(a => a.activity_type === 'reply' || a.activity_type === 'message')
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

  return (
    <div className="space-y-4">
      {/* Original ticket description — right side, red (demandeur) */}
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-red-100 border border-red-200 text-red-900">
            <p className="text-sm whitespace-pre-wrap">{ticket.description || 'Aucune description.'}</p>
          </div>
          <div className="flex justify-end items-center gap-1.5 mt-1">
            <span className="text-[11px] text-muted-foreground">
              {ticket.reporter_name || 'Demandeur'} • {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground text-center">Chargement des messages…</p>
      )}

      {replyActivities.map((activity) => {
        const meta = activity.metadata as any;
        const isInbound = meta?.direction === 'inbound';

        if (isInbound) {
          return (
            <div key={activity.id} className="flex justify-end">
              <div className="max-w-[75%]">
                <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-red-100 border border-red-200 text-red-900">
                  <p className="text-sm whitespace-pre-wrap">{activity.content}</p>
                </div>
                <div className="flex justify-end items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-muted-foreground">
                    {ticket.reporter_name || 'Demandeur'} • {activity.created_at && format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={activity.id} className="flex justify-start">
            <div className="max-w-[75%]">
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-green-100 border border-green-200 text-green-900">
                <p className="text-sm whitespace-pre-wrap">{activity.content}</p>
              </div>
              <div className="flex justify-start items-center gap-1.5 mt-1">
                <span className="text-[11px] text-muted-foreground">
                  Vous • {activity.created_at && format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {!loading && replyActivities.length === 0 && (
        <p className="text-xs text-muted-foreground text-center italic">Aucune réponse pour le moment.</p>
      )}
    </div>
  );
}

function ActivityTimeline({ ticketId }: { ticketId: string }) {
  const { activities, loading } = useTicketActivities(ticketId);
  const nonReplyActivities = (activities || []).filter(a => a.activity_type !== 'reply');

  if (loading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (nonReplyActivities.length === 0) return <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>;

  return (
    <div className="space-y-3">
      {nonReplyActivities.map((activity) => (
        <div key={activity.id} className="flex gap-3 text-sm">
          <div className="mt-1 h-2 w-2 rounded-full flex-shrink-0 bg-muted-foreground" />
          <div className="flex-1">
            <p className="text-foreground">
              {activity.activity_type === 'status_change' && (
                <>Statut changé de <Badge variant="outline" className="text-xs mx-1">{activity.old_value}</Badge> à <Badge variant="outline" className="text-xs mx-1">{activity.new_value}</Badge></>
              )}
              {activity.activity_type === 'assignment' && `Assignation modifiée`}
              {activity.activity_type === 'priority_change' && (
                <>Priorité changée de <Badge variant="outline" className="text-xs mx-1">{activity.old_value}</Badge> à <Badge variant="outline" className="text-xs mx-1">{activity.new_value}</Badge></>
              )}
              {activity.activity_type === 'comment' && activity.content}
              {!['status_change', 'assignment', 'priority_change', 'comment'].includes(activity.activity_type) && activity.activity_type}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activity.created_at && format(new Date(activity.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReplyForm({ ticket, onSent }: { ticket: Ticket; onSent?: () => void }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const canReply = !!ticket.reporter_email;

  const handleSend = async () => {
    if (!content.trim() || !canReply) return;
    setSending(true);
    try {
      const { error: activityError } = await supabase
        .from('ticket_activities')
        .insert({
          ticket_id: ticket.id,
          actor_id: user?.id || null,
          activity_type: 'reply',
          content: content.trim(),
          metadata: { direction: 'outbound', sent_to: ticket.reporter_email },
        });

      if (activityError) throw activityError;

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          template: 'reply',
          to: [ticket.reporter_email],
          data: {
            ticketTitle: ticket.title,
            replyContent: content.trim(),
            replierName: user?.user_metadata?.full_name || 'L\'équipe support',
            ticketId: ticket.id,
          },
        },
      });

      if (emailError) {
        console.error('Email send error:', emailError);
        toast.warning('Réponse enregistrée mais l\'email n\'a pas pu être envoyé.');
      } else {
        toast.success('Réponse envoyée par email.');
      }

      setContent('');
      onSent?.();
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Erreur lors de l\'envoi de la réponse.');
    } finally {
      setSending(false);
    }
  };

  if (!canReply) {
    return (
      <div className="text-sm text-muted-foreground italic text-center py-2">
        Aucun email de demandeur – impossible de répondre.
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        placeholder={`Répondre à ${ticket.reporter_name || ticket.reporter_email}…`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        className="resize-none flex-1 min-h-[44px]"
      />
      <Button onClick={handleSend} disabled={!content.trim() || sending} size="icon" className="h-11 w-11 shrink-0 min-h-[44px] active:scale-95 transition-transform">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TicketDetailDialog({ ticket, open, onOpenChange }: TicketDetailDialogProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  if (!ticket) return null;

  const location = ticket.location as Record<string, any> | null;
  const locationName = location?.name || location?.element_name || null;

  const headerContent = (
    <>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
          {getStatusIcon(ticket.status)}
          <span className="ml-1">{TICKET_STATUSES[ticket.status as keyof typeof TICKET_STATUSES]}</span>
        </Badge>
        <Badge className={`text-xs ${getPriorityColor(ticket.priority || 'medium')}`}>
          {TICKET_PRIORITIES[ticket.priority as keyof typeof TICKET_PRIORITIES] || 'Moyenne'}
        </Badge>
        {ticket.source === 'qr_code' && (
          <Badge variant="outline" className="text-xs gap-1">
            <QrCode className="h-3 w-3" /> QR Code
          </Badge>
        )}
        {ticket.initiality && (
          <Badge variant="outline" className="text-xs">
            {ticket.initiality === 'relance' ? `Relance #${ticket.relance_index ?? 1}` : 'Initial'}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
        </span>
        {locationName && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {locationName}
          </span>
        )}
        {ticket.reporter_name && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {ticket.reporter_name}
          </span>
        )}
        {ticket.reporter_email && (
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {ticket.reporter_email}
          </span>
        )}
      </div>
    </>
  );

  const conversationContent = (
    <div key={refreshKey}>
      <ConversationThread ticket={ticket} ticketId={ticket.id} />

      {/* Attachments */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="pt-4">
          <Separator className="mb-4" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Pièces jointes ({ticket.attachments.length})
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ticket.attachments.map((att: any, i: number) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md border border-border overflow-hidden active:scale-95 transition-transform"
              >
                {att.type === 'image' ? (
                  <img src={att.url} alt={att.name} className="w-full h-20 object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-20 bg-muted">
                    {getMediaIcon(att.type)}
                  </div>
                )}
                <div className="px-1.5 py-0.5 text-[10px] text-muted-foreground truncate">
                  {att.name}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity log */}
      <div className="pt-4">
        <Separator className="mb-4" />
        <details className="group">
          <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none min-h-[44px] flex items-center active:opacity-70 transition-opacity">
            Historique des actions ▸
          </summary>
          <div className="mt-3">
            <ActivityTimeline ticketId={ticket.id} />
          </div>
        </details>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="text-lg leading-snug pr-8">{formatTicketDisplayTitle(ticket)}</span>}
      description={headerContent}
      footer={<ReplyForm ticket={ticket} onSent={() => setRefreshKey(k => k + 1)} />}
    >
      {conversationContent}
    </ResponsiveDialog>
  );
}
