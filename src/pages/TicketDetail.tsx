import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Calendar, MapPin, User, Mail, Phone,
  QrCode, Send, Image, Mic, Video, Paperclip,
} from 'lucide-react';
import { useTicket } from '@/hooks/useTicket';
import { useTicketActivities, TicketStatus } from '@/hooks/useTickets';
import { URGENCY_CONFIG, STATUS_CONFIG } from '@/components/tickets/TicketsList';
import { formatTicketDisplayTitle } from '@/utils/ticketUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────
const getMediaIcon = (type: string) => {
  if (type === 'image') return <Image className="h-4 w-4" />;
  if (type === 'audio') return <Mic className="h-4 w-4" />;
  if (type === 'video') return <Video className="h-4 w-4" />;
  return <Paperclip className="h-4 w-4" />;
};

// ── Page Component ───────────────────────────────────────────────────
export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ticket, loading, error, refresh } = useTicket(id);
  const { activities, loading: activitiesLoading, addActivity } = useTicketActivities(id || '');
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement du ticket…</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !ticket) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-10 max-w-7xl mx-auto text-center py-12">
          <p className="text-muted-foreground mb-4">Ce ticket n'existe pas ou vous n'y avez pas accès.</p>
          <Button variant="outline" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la liste
          </Button>
        </div>
      </AppLayout>
    );
  }

  const urgency = URGENCY_CONFIG[(ticket.priority as keyof typeof URGENCY_CONFIG)] ?? URGENCY_CONFIG.medium;
  const status = STATUS_CONFIG[(ticket.status as keyof typeof STATUS_CONFIG)] ?? STATUS_CONFIG.open;
  const StatusIcon = status.icon;
  const location = ticket.location as Record<string, any> | null;
  const locationName = location?.name || location?.element_name || null;
  const canReply = !!ticket.reporter_email;

  const replyActivities = (activities || [])
    .filter((a) => a.activity_type === 'reply')
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

  const nonReplyActivities = (activities || []).filter((a) => a.activity_type !== 'reply');

  // ── Actions ──
  const handleStatusChange = async (newStatus: string) => {
    try {
      await supabase.from('tickets').update({ status: newStatus as TicketStatus }).eq('id', ticket.id);
      toast.success('Statut mis à jour');
      refresh();
    } catch {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !canReply) return;
    setSending(true);
    try {
      await addActivity({
        ticket_id: ticket.id,
        actor_id: user?.id || null,
        activity_type: 'reply',
        content: replyContent.trim(),
        metadata: { direction: 'outbound', sent_to: ticket.reporter_email },
      });

      await supabase.functions.invoke('send-email', {
        body: {
          template: 'reply',
          to: [ticket.reporter_email],
          data: {
            ticketTitle: ticket.title,
            replyContent: replyContent.trim(),
            replierName: user?.user_metadata?.full_name || "L'équipe support",
            ticketId: ticket.id,
          },
        },
      });

      toast.success('Réponse envoyée par email.');
      setReplyContent('');
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi de la réponse.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/tickets')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Retour à la liste
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold leading-snug text-foreground mb-2">
                {formatTicketDisplayTitle(ticket)}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {/* Status tag */}
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border"
                  style={{ backgroundColor: status.bg, color: status.text, borderColor: status.border }}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
                {/* Urgency tag */}
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border"
                  style={{ backgroundColor: urgency.bg, color: urgency.text, borderColor: urgency.border }}
                >
                  {urgency.label}
                </span>
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
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
            </span>
            {locationName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {locationName}
              </span>
            )}
            {ticket.reporter_name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {ticket.reporter_name}
              </span>
            )}
            {ticket.reporter_email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {ticket.reporter_email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Conversation / Diagnostic ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation thread */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-red-100 border border-red-200 text-red-900">
                      <p className="text-sm whitespace-pre-wrap">{ticket.description || 'Aucune description.'}</p>
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {ticket.reporter_name || 'Demandeur'} • {format(new Date(ticket.created_at), 'dd MMM HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>

                {activitiesLoading && (
                  <p className="text-xs text-muted-foreground text-center">Chargement des messages…</p>
                )}

                {replyActivities.map((activity) => {
                  const meta = activity.metadata as any;
                  const isInbound = meta?.direction === 'inbound';

                  return (
                    <div key={activity.id} className={`flex ${isInbound ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                        <div
                          className={`rounded-2xl px-4 py-3 border ${
                            isInbound
                              ? 'rounded-tr-sm bg-red-100 border-red-200 text-red-900'
                              : 'rounded-tl-sm bg-green-100 border-green-200 text-green-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{activity.content}</p>
                        </div>
                        <div className={`flex ${isInbound ? 'justify-end' : 'justify-start'} mt-1`}>
                          <span className="text-[11px] text-muted-foreground">
                            {isInbound ? ticket.reporter_name || 'Demandeur' : 'Vous'} •{' '}
                            {activity.created_at && format(new Date(activity.created_at), 'dd MMM HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!activitiesLoading && replyActivities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center italic">Aucune réponse pour le moment.</p>
                )}

                {/* Reply form */}
                <Separator />
                {canReply ? (
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder={`Répondre à ${ticket.reporter_name || ticket.reporter_email}…`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={2}
                      className="resize-none flex-1"
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyContent.trim() || sending}
                      size="icon"
                      className="h-11 w-11 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-2">
                    Aucun email de demandeur – impossible de répondre.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <Card className="rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Pièces jointes ({ticket.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {ticket.attachments.map((att: any, i: number) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border overflow-hidden hover:shadow-sm transition-shadow"
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Actions / Timeline ── */}
          <div className="space-y-6">
            {/* Quick actions card */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Changer le statut</label>
                  <Select value={ticket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            {React.createElement(cfg.icon, { className: 'h-3 w-3', style: { color: cfg.text } })}
                            {cfg.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priorité</span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium border"
                      style={{ backgroundColor: urgency.bg, color: urgency.text, borderColor: urgency.border }}
                    >
                      {urgency.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{ticket.source === 'qr_code' ? 'QR Code' : 'Dashboard'}</span>
                  </div>
                  {ticket.assigned_to && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assigné à</span>
                      <span className="font-medium">{ticket.assigned_to}</span>
                    </div>
                  )}
                  {ticket.category_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catégorie</span>
                      <span className="font-medium">{ticket.category_code}</span>
                    </div>
                  )}
                  {ticket.nature_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nature</span>
                      <span className="font-medium">{ticket.nature_code}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline card */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Historique</CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <p className="text-xs text-muted-foreground">Chargement…</p>
                ) : nonReplyActivities.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucune activité enregistrée.</p>
                ) : (
                  <div className="space-y-3">
                    {nonReplyActivities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 text-xs">
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-foreground">
                            {activity.activity_type === 'status_change' && (
                              <>
                                Statut : {activity.old_value} → {activity.new_value}
                              </>
                            )}
                            {activity.activity_type === 'assignment' && 'Assignation modifiée'}
                            {activity.activity_type === 'priority_change' && (
                              <>
                                Priorité : {activity.old_value} → {activity.new_value}
                              </>
                            )}
                            {activity.activity_type === 'comment' && activity.content}
                            {!['status_change', 'assignment', 'priority_change', 'comment'].includes(
                              activity.activity_type
                            ) && activity.activity_type}
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            {activity.created_at &&
                              format(new Date(activity.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}

export default TicketDetail;
