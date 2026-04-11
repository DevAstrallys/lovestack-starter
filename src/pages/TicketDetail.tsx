import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Calendar, MapPin, User, Mail,
  QrCode, Image, Mic, Video, Paperclip, Copy, Link2, Tag,
  Wrench, Send, FileText, Clock, Bell, BellOff,
} from 'lucide-react';
import { useTicket } from '@/hooks/useTicket';
import { useTicketActivities } from '@/hooks/useTickets';
import type { TicketStatus, TicketAttachment } from '@/types';
import { useUserTicketRole } from '@/hooks/useUserTicketRole';
import { useAuth } from '@/contexts/AuthContext';
import { URGENCY_CONFIG, STATUS_CONFIG } from '@/components/tickets/TicketsList';
import { TICKET_PRIORITIES, extractSubject, extractTitleBadges } from '@/utils/ticketUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { updateTicket as updateTicketService } from '@/services/tickets';
import { notifyStatusChange } from '@/services/tickets/notifications';
import { isFollowingTicket, followTicket, unfollowTicket } from '@/services/tickets/followers';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const log = createLogger('page:ticket-detail');

import { EmergencyButton } from '@/components/tickets/cockpit/EmergencyButton';
import { SmartDispatcher } from '@/components/tickets/cockpit/SmartDispatcher';
import { ChatBar } from '@/components/tickets/cockpit/ChatBar';

const getMediaIcon = (type: string) => {
  if (type === 'image') return <Image className="h-5 w-5" />;
  if (type === 'audio') return <Mic className="h-5 w-5" />;
  if (type === 'video') return <Video className="h-5 w-5" />;
  return <Paperclip className="h-5 w-5" />;
};

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ticket, loading, error, refresh } = useTicket(id);
  const { activities, loading: activitiesLoading, refresh: refreshActivities } = useTicketActivities(id || '');
  const { canManageTicket, canAddPrivateNote, canMarkDuplicate, canDispatch } = useUserTicketRole();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Check follow status on mount
  React.useEffect(() => {
    if (!id || !user) return;
    const checkFollow = async () => {
      try {
        const following = await isFollowingTicket(id, user.id);
        setIsFollowing(following);
      } catch (err) {
        log.error('Failed to check follow status', { error: err });
      }
    };
    checkFollow();
  }, [id, user?.id]);

  const handleToggleFollow = async () => {
    if (!id || !user) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowTicket(id, user.id);
        setIsFollowing(false);
        toast.success('Vous ne suivez plus ce ticket');
      } else {
        await followTicket(id, user.id);
        setIsFollowing(true);
        toast.success('Vous suivez ce ticket');
      }
    } catch (err) {
      log.error('Failed to toggle follow', { error: err });
      toast.error('Erreur');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    refresh();
    refreshActivities();
  };

  const toggleMessage = useCallback((msgId: string) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }, []);

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
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
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
  const ticketAny = ticket as any;
  const titleBadges = extractTitleBadges(ticket.title);
  const subject = extractSubject(ticket.title);

  const priorityLabel = TICKET_PRIORITIES[ticket.priority as keyof typeof TICKET_PRIORITIES] || ticket.priority;
  const categoryLabel = ticket.category_code || null;
  const actionLabel = ticketAny.action_code || null;

  const replyActivities = (activities || [])
    .filter((a) => a.activity_type === 'reply' || a.activity_type === 'message')
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

  const handleStatusChange = async (newStatus: string) => {
    if (!canManageTicket) {
      toast.error('Vous n\'avez pas les droits pour modifier le statut');
      return;
    }
    try {
      const oldStatus = ticket.status;
      const updates: Record<string, string> = { status: newStatus };
      if (!ticketAny.first_opened_at && newStatus !== 'open') {
        updates.first_opened_at = new Date().toISOString();
      }
      await updateTicketService(ticket.id, updates);
      toast.success('Statut mis à jour');
      refresh();

      // Send notification
      notifyStatusChange({
        ticketId: ticket.id,
        ticketTitle: subject,
        oldStatus,
        newStatus,
        reporterEmail: ticket.reporter_email,
        reporterName: ticket.reporter_name,
        communicationMode: ticket.communication_mode,
      });
    } catch (err) {
      log.error('Failed to update status', err);
      toast.error('Erreur');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!canManageTicket) return;
    try {
      await updateTicketService(ticket.id, { priority: newPriority as any });
      toast.success('Priorité mise à jour');
      refresh();
    } catch (err) {
      log.error('Failed to update priority', err);
      toast.error('Erreur');
    }
  };

  const handleMarkDuplicate = async () => {
    if (!canMarkDuplicate) return;
    const dupId = prompt('ID du ticket original (UUID) :');
    if (!dupId?.trim()) return;
    try {
      await updateTicketService(ticket.id, { duplicate_of_id: dupId.trim(), status: 'closed' as TicketStatus } as any);
      toast.success('Marqué comme doublon');
      refresh();
    } catch (err) {
      log.error('Failed to mark duplicate', err);
      toast.error('Erreur');
    }
  };

  const shortId = ticket.id?.slice(0, 8) || '';

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-64px)] bg-muted/30">
        {/* ── TOP HEADER BAR ── */}
        <div className="bg-card border-b px-6 py-5">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/tickets')}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour aux tickets
              </Button>
              {/* Follow button — available for all connected users */}
              <Button
                variant={isFollowing ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleToggleFollow}
                disabled={followLoading}
              >
                {isFollowing ? <BellOff className="h-4 w-4 mr-1.5" /> : <Bell className="h-4 w-4 mr-1.5" />}
                {isFollowing ? 'Ne plus suivre' : 'Suivre'}
              </Button>
            </div>

            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {subject}
                </h1>

                {(ticket.building_name || ticket.organization_name) && (
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    {ticket.building_name && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {ticket.building_name}
                      </span>
                    )}
                    {ticket.organization_name && (
                      <span className="inline-flex items-center gap-1">
                        — {ticket.organization_name}
                      </span>
                    )}
                    <span className="text-muted-foreground/60 font-normal text-xs">
                      #{shortId}
                    </span>
                  </div>
                )}
                {!ticket.building_name && !ticket.organization_name && (
                  <span className="text-muted-foreground font-normal text-sm mt-1 block">
                    #{shortId}
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {ticketAny.assigned_to && (
                    <Badge variant="secondary" className="text-xs px-3 py-1">
                      Prestataire : Assigné
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs px-3 py-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    Date : {format(new Date(ticket.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </Badge>
                  {ticket.source === 'qr_code' && (
                    <Badge variant="secondary" className="text-xs px-3 py-1">
                      <QrCode className="h-3 w-3 mr-1" /> QR Code
                    </Badge>
                  )}
                  {ticketAny.duplicate_of_id && (
                    <Badge variant="outline" className="text-xs px-3 py-1 gap-1 text-orange-600 border-orange-300">
                      <Copy className="h-3 w-3" /> Doublon
                    </Badge>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <div
                  className="rounded-xl border-2 px-5 py-3 text-center min-w-[180px]"
                  style={{ borderColor: status.border, backgroundColor: status.bg }}
                >
                  <span className="text-lg font-bold flex items-center justify-center gap-2" style={{ color: status.text }}>
                    <StatusIcon className="h-5 w-5" />
                    {status.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* ── LEFT: Main content ── */}
            <div className="space-y-6" key={refreshKey}>
              <Card className="rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-foreground mb-3">
                    Détails du Signalement
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                      style={{ backgroundColor: urgency.bg, color: urgency.text, borderColor: urgency.border }}
                    >
                      {urgency.dot} {priorityLabel}
                    </span>

                    {categoryLabel && (
                      <Badge className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                        <Wrench className="h-3 w-3 mr-1" /> {categoryLabel}
                      </Badge>
                    )}

                    {locationName && (
                      <Badge variant="secondary" className="text-xs px-3 py-1">
                        <MapPin className="h-3 w-3 mr-1" /> {locationName}
                      </Badge>
                    )}

                    {actionLabel && (
                      <Badge variant="outline" className="text-xs px-3 py-1">
                        {actionLabel}
                      </Badge>
                    )}

                    {titleBadges.map((badge, i) => (
                      <Badge key={i} variant="outline" className="text-xs px-3 py-1">
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                      {ticket.attachments.map((att: TicketAttachment, i: number) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden border hover:shadow-lg transition-shadow group aspect-[4/3]"
                        >
                          {att.type === 'image' ? (
                            <img
                              src={att.url}
                              alt={att.name || `Photo ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-muted gap-2">
                              {getMediaIcon(att.type)}
                              <span className="text-[10px] text-muted-foreground">{att.type?.toUpperCase()}</span>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  <Separator className="my-4" />

                  <h3 className="text-base font-bold text-foreground mb-2">
                    Détails de la Demande
                  </h3>
                  <div className="space-y-2 text-sm text-foreground">
                    <p>
                      <span className="font-semibold">Délai Réponse Souhaité :</span>{' '}
                      <span>{'< 24h'}</span>
                    </p>
                    <p>
                      <span className="font-semibold">Description :</span>{' '}
                      {ticket.description || 'Aucune description fournie.'}
                    </p>
                    {ticket.reporter_name && (
                      <p>
                        <span className="font-semibold">Déclarant :</span>{' '}
                        {ticket.reporter_name}
                        {ticket.reporter_email && ` (${ticket.reporter_email})`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Discussion section */}
              <Card className="rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="px-6 py-4 border-b bg-card">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Discussion
                    </h2>
                  </div>

                  <div className="px-6 py-4 space-y-4 max-h-[400px] overflow-y-auto">
                    <div className="flex items-start gap-2 justify-end">
                      <Checkbox
                        checked={selectedMessages.has('original')}
                        onCheckedChange={() => toggleMessage('original')}
                        className="mt-3 shrink-0"
                        title="Inclure dans le transfert"
                      />
                      <div className="max-w-[80%]">
                        <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-red-50 border border-red-200 text-red-900">
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
                      <p className="text-xs text-muted-foreground text-center">Chargement…</p>
                    )}

                    {replyActivities.map((activity) => {
                      const meta = activity.metadata as any;
                      const isInbound = meta?.direction === 'inbound';

                      return (
                        <div key={activity.id} className={`flex items-start gap-2 ${isInbound ? 'justify-end' : 'justify-start'}`}>
                          {isInbound && (
                            <Checkbox
                              checked={selectedMessages.has(activity.id)}
                              onCheckedChange={() => toggleMessage(activity.id)}
                              className="mt-3 shrink-0"
                            />
                          )}
                          <div className="max-w-[80%]">
                            <div
                              className={`rounded-2xl px-4 py-3 border ${
                                isInbound
                                  ? 'rounded-tr-sm bg-red-50 border-red-200 text-red-900'
                                  : 'rounded-tl-sm bg-green-50 border-green-200 text-green-900'
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
                          {!isInbound && (
                            <Checkbox
                              checked={selectedMessages.has(activity.id)}
                              onCheckedChange={() => toggleMessage(activity.id)}
                              className="mt-3 shrink-0"
                            />
                          )}
                        </div>
                      );
                    })}

                    {!activitiesLoading && replyActivities.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center italic">Aucune réponse pour le moment.</p>
                    )}

                    {selectedMessages.size > 0 && (
                      <div className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {selectedMessages.size} message(s) sélectionné(s) pour le transfert
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Chat bar — all connected users can reply publicly; private notes gated */}
                  <ChatBar ticket={ticket} onSent={handleRefresh} canAddPrivateNote={canAddPrivateNote} />
                </CardContent>
              </Card>

              {/* Bottom actions — manager only */}
              {canMarkDuplicate && (
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-sm font-semibold uppercase tracking-wide"
                    onClick={handleMarkDuplicate}
                  >
                    <Link2 className="h-4 w-4 mr-2" /> Marquer comme doublon
                  </Button>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="space-y-4">
              {/* Emergency — available for all */}
              <EmergencyButton ticket={ticket} />

              {/* Management card — only for managers */}
              {canManageTicket && (
                <Card className="rounded-xl">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Prestataire
                      </label>
                      <Select>
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue placeholder="Sélectionner…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Non assigné</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Statut
                      </label>
                      <Select value={ticket.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                {React.createElement(cfg.icon, { className: 'h-3.5 w-3.5', style: { color: cfg.text } })}
                                {cfg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Priorité
                      </label>
                      <Select value={ticket.priority || 'medium'} onValueChange={handlePriorityChange}>
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TICKET_PRIORITIES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source</span>
                        <span className="font-medium">{ticket.source === 'qr_code' ? 'QR Code' : 'Dashboard'}</span>
                      </div>
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Créé le</span>
                        <span className="font-medium">{format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Info card for non-managers (read-only) */}
              {!canManageTicket && (
                <Card className="rounded-xl">
                  <CardContent className="p-5 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Statut</span>
                      <span className="font-medium flex items-center gap-1" style={{ color: status.text }}>
                        <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priorité</span>
                      <span className="font-medium" style={{ color: urgency.text }}>
                        {urgency.dot} {priorityLabel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Créé le</span>
                      <span className="font-medium">{format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dispatcher — managers only */}
              {canDispatch && (
                <SmartDispatcher
                  ticket={ticket}
                  activities={activities || []}
                  onDispatched={handleRefresh}
                  selectedMessageIds={selectedMessages}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default TicketDetail;
