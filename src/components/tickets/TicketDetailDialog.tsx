import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertCircle, CheckCircle, Clock, Pause, XCircle, 
  Calendar, MapPin, Tag, User, Phone, Mail, 
  Image, Mic, Video, Paperclip, QrCode, Send, MessageSquare
} from 'lucide-react';
import { Ticket, useTicketActivities } from '@/hooks/useTickets';
import { TICKET_STATUSES, TICKET_PRIORITIES } from '@/utils/ticketUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

function ActivityTimeline({ ticketId }: { ticketId: string }) {
  const { activities, loading } = useTicketActivities(ticketId);

  if (loading) return <p className="text-sm text-muted-foreground">Chargement de l'historique…</p>;
  if (activities.length === 0) return <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>;

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3 text-sm">
          <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
            activity.activity_type === 'reply' ? 'bg-primary' : 'bg-muted-foreground'
          }`} />
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
              {activity.activity_type === 'reply' && (
                <div className="rounded-md border border-border bg-muted/50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-xs">
                      {(activity.metadata as any)?.direction === 'inbound' ? 'Réponse du demandeur' : 'Réponse envoyée'}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{activity.content}</p>
                </div>
              )}
              {!['status_change', 'assignment', 'priority_change', 'comment', 'reply'].includes(activity.activity_type) && activity.activity_type}
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

function ReplyForm({ ticket }: { ticket: Ticket }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const canReply = !!ticket.reporter_email;

  const handleSend = async () => {
    if (!content.trim() || !canReply) return;
    setSending(true);
    try {
      // 1. Save as ticket_activity
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

      // 2. Send email via edge function
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
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Erreur lors de l\'envoi de la réponse.');
    } finally {
      setSending(false);
    }
  };

  if (!canReply) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Aucun email de demandeur – impossible de répondre.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder={`Répondre à ${ticket.reporter_name || ticket.reporter_email}…`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="resize-none"
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          <Mail className="h-3 w-3 inline mr-1" />
          Sera envoyé à {ticket.reporter_email}
        </p>
        <Button onClick={handleSend} disabled={!content.trim() || sending} size="sm">
          <Send className="h-4 w-4 mr-1.5" />
          {sending ? 'Envoi…' : 'Envoyer'}
        </Button>
      </div>
    </div>
  );
}

export function TicketDetailDialog({ ticket, open, onOpenChange }: TicketDetailDialogProps) {
  if (!ticket) return null;

  const location = ticket.location as Record<string, any> | null;
  const locationName = location?.name || location?.element_name || null;
  const meta = ticket.meta as Record<string, any> | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg leading-snug pr-8">{ticket.title}</DialogTitle>
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
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Description */}
            <section className="space-y-2 pt-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</h4>
              <p className="text-sm whitespace-pre-wrap">{ticket.description || 'Aucune description.'}</p>
            </section>

            <Separator />

            {/* Metadata grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Créé le</p>
                  <p className="text-muted-foreground">{format(new Date(ticket.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Dernière interaction</p>
                  <p className="text-muted-foreground">{ticket.last_interaction_at ? format(new Date(ticket.last_interaction_at), 'dd MMMM yyyy à HH:mm', { locale: fr }) : '—'}</p>
                </div>
              </div>

              {locationName && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Lieu</p>
                    <p className="text-muted-foreground">{locationName}</p>
                  </div>
                </div>
              )}

              {(ticket.category_code || ticket.nature_code) && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Catégorie / Action</p>
                    <p className="text-muted-foreground">
                      {ticket.nature_code}{ticket.nature_code && ticket.category_code ? ' • ' : ''}{ticket.category_code}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Reporter */}
            {(ticket.reporter_name || ticket.reporter_email || ticket.reporter_phone) && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Demandeur</h4>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {ticket.reporter_name && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{ticket.reporter_name}</span>
                      </div>
                    )}
                    {ticket.reporter_email && (
                      <a href={`mailto:${ticket.reporter_email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                        <Mail className="h-4 w-4" />
                        <span>{ticket.reporter_email}</span>
                      </a>
                    )}
                    {ticket.reporter_phone && (
                      <a href={`tel:${ticket.reporter_phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                        <Phone className="h-4 w-4" />
                        <span>{ticket.reporter_phone}</span>
                      </a>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <>
                <Separator />
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Pièces jointes ({ticket.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ticket.attachments.map((att: any, i: number) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-md border border-border overflow-hidden hover:ring-2 hover:ring-primary/40 transition-shadow"
                      >
                        {att.type === 'image' ? (
                          <img src={att.url} alt={att.name} className="w-full h-28 object-cover" />
                        ) : att.type === 'video' ? (
                          <video src={att.url} className="w-full h-28 object-cover" />
                        ) : att.type === 'audio' ? (
                          <div className="flex items-center justify-center h-28 bg-muted p-2">
                            <audio controls src={att.url} className="w-full h-8" onClick={(e) => e.preventDefault()} />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-28 bg-muted">
                            <Paperclip className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="px-2 py-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
                          {getMediaIcon(att.type)}
                          <span className="truncate">{att.name}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Reply form */}
            <Separator />
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Répondre</h4>
              <ReplyForm ticket={ticket} />
            </section>

            {/* Activity timeline */}
            <Separator />
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Historique</h4>
              <ActivityTimeline ticketId={ticket.id} />
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
