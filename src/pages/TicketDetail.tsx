import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Calendar, MapPin, User, Mail,
  QrCode, Image, Mic, Video, Paperclip, Copy, Link2, Tag,
} from 'lucide-react';
import { useTicket } from '@/hooks/useTicket';
import { useTicketActivities, TicketStatus } from '@/hooks/useTickets';
import { URGENCY_CONFIG, STATUS_CONFIG } from '@/components/tickets/TicketsList';
import { TICKET_PRIORITIES } from '@/utils/ticketUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { EmergencyButton } from '@/components/tickets/cockpit/EmergencyButton';
import { AuditTrail } from '@/components/tickets/cockpit/AuditTrail';
import { SmartDispatcher } from '@/components/tickets/cockpit/SmartDispatcher';
import { ChatBar } from '@/components/tickets/cockpit/ChatBar';

const getMediaIcon = (type: string) => {
  if (type === 'image') return <Image className="h-4 w-4" />;
  if (type === 'audio') return <Mic className="h-4 w-4" />;
  if (type === 'video') return <Video className="h-4 w-4" />;
  return <Paperclip className="h-4 w-4" />;
};

/** Extract the raw subject from the title: last segment after — (strip brackets) */
function extractSubject(title: string): string {
  // Remove everything in [brackets]
  const cleaned = title.replace(/\[([^\]]*)\]/g, '').trim();
  const segments = cleaned.split('—').map(s => s.trim()).filter(Boolean);
  return segments[segments.length - 1] || title;
}

/** Extract metadata badges from the title brackets */
function extractTitleBadges(title: string): string[] {
  const badges: string[] = [];
  const bracketRegex = /\[([^\]]*)\]/g;
  let match: RegExpExecArray | null;
  while ((match = bracketRegex.exec(title)) !== null) {
    const content = match[1].trim();
    if (content) badges.push(content);
  }
  return badges;
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ticket, loading, error, refresh } = useTicket(id);
  const { activities, loading: activitiesLoading } = useTicketActivities(id || '');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    refresh();
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

  // Priority label for badge
  const priorityLabel = TICKET_PRIORITIES[ticket.priority as keyof typeof TICKET_PRIORITIES] || ticket.priority;

  // Category / action labels for badges
  const categoryLabel = ticket.category_code || null;
  const actionLabel = ticketAny.action_code || null;
  const initialityLabel = ticketAny.initiality === 'relance'
    ? `Relance #${ticketAny.relance_index || 1}`
    : 'Initial';

  const replyActivities = (activities || [])
    .filter((a) => a.activity_type === 'reply')
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (!ticketAny.first_opened_at && newStatus !== 'open') {
        updates.first_opened_at = new Date().toISOString();
      }
      await supabase.from('tickets').update(updates).eq('id', ticket.id);
      toast.success('Statut mis à jour');
      refresh();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleMarkDuplicate = async () => {
    const dupId = prompt('ID du ticket original (UUID) :');
    if (!dupId?.trim()) return;
    try {
      await supabase.from('tickets').update({ duplicate_of_id: dupId.trim(), status: 'closed' as TicketStatus } as any).eq('id', ticket.id);
      toast.success('Marqué comme doublon');
      refresh();
    } catch {
      toast.error('Erreur');
    }
  };

  const isUrgent = ticket.priority === 'urgent' || ticket.priority === 'high';

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* ── HEADER ── */}
        <div className="border-b bg-card px-4 py-3 shrink-0">
          <div className="max-w-[1400px] mx-auto">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground hover:text-foreground mb-2"
              onClick={() => navigate('/tickets')}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
            </Button>

            {/* Clean subject title */}
            <h1 className="text-xl font-bold leading-snug text-foreground">
              {subject}
            </h1>

            {/* Metadata badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {/* Initiality badge */}
              <Badge variant="outline" className="text-[11px] gap-1">
                <Tag className="h-3 w-3" /> {initialityLabel}
              </Badge>

              {/* Action badge (e.g. "Je signale") */}
              {actionLabel && (
                <Badge variant="outline" className="text-[11px]">
                  {actionLabel}
                </Badge>
              )}

              {/* Category badge */}
              {categoryLabel && (
                <Badge variant="secondary" className="text-[11px]">
                  {categoryLabel}
                </Badge>
              )}

              {/* Priority badge */}
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
                style={{ backgroundColor: urgency.bg, color: urgency.text, borderColor: urgency.border }}
              >
                {urgency.dot} {priorityLabel}
              </span>

              {/* Status badge */}
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
                style={{ backgroundColor: status.bg, color: status.text, borderColor: status.border }}
              >
                <StatusIcon className="h-3 w-3" /> {status.label}
              </span>

              {/* Title bracket badges (extra info) */}
              {titleBadges.map((badge, i) => (
                <Badge key={i} variant="outline" className="text-[11px]">
                  {badge}
                </Badge>
              ))}

              {ticket.source === 'qr_code' && (
                <Badge variant="outline" className="text-[11px] gap-1">
                  <QrCode className="h-3 w-3" /> QR Code
                </Badge>
              )}

              {ticketAny.duplicate_of_id && (
                <Badge variant="outline" className="text-[11px] gap-1 text-orange-600 border-orange-300">
                  <Copy className="h-3 w-3" /> Doublon
                </Badge>
              )}
            </div>

            {/* Meta info line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
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

        {/* ── BODY: 65/35 two-column layout ── */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0">
            {/* ── LEFT COLUMN: Tabs Discussion / Audit ── */}
            <div className="flex flex-col h-full border-r overflow-hidden" key={refreshKey}>
              <Tabs defaultValue="discussion" className="flex flex-col h-full">
                <TabsList className="mx-4 mt-3 shrink-0 w-fit">
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  <TabsTrigger value="audit">Journal de gestion</TabsTrigger>
                </TabsList>

                {/* Discussion tab */}
                <TabsContent value="discussion" className="flex-1 overflow-y-auto px-4 py-4 space-y-4 m-0">
                  {/* Original message with checkbox */}
                  <div className="flex items-start gap-2 justify-end">
                    <Checkbox
                      checked={selectedMessages.has('original')}
                      onCheckedChange={() => toggleMessage('original')}
                      className="mt-3 shrink-0"
                      title="Inclure dans le transfert"
                    />
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
                            title="Inclure dans le transfert"
                          />
                        )}
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
                        {!isInbound && (
                          <Checkbox
                            checked={selectedMessages.has(activity.id)}
                            onCheckedChange={() => toggleMessage(activity.id)}
                            className="mt-3 shrink-0"
                            title="Inclure dans le transfert"
                          />
                        )}
                      </div>
                    );
                  })}

                  {!activitiesLoading && replyActivities.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center italic">Aucune réponse pour le moment.</p>
                  )}

                  {/* Selected messages indicator */}
                  {selectedMessages.size > 0 && (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {selectedMessages.size} message(s) sélectionné(s) pour le transfert
                      </Badge>
                    </div>
                  )}

                  {/* Attachments */}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <>
                      <Separator />
                      <div>
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
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Audit tab */}
                <TabsContent value="audit" className="flex-1 overflow-y-auto px-4 py-4 m-0">
                  <AuditTrail
                    ticket={ticket}
                    activities={activities || []}
                    loading={activitiesLoading}
                    onNoteAdded={handleRefresh}
                  />
                </TabsContent>

                {/* Chat bar at the bottom */}
                <div className="shrink-0">
                  <ChatBar ticket={ticket} onSent={handleRefresh} />
                </div>
              </Tabs>
            </div>

            {/* ── RIGHT COLUMN: Actions / Dispatcher ── */}
            <div className="overflow-y-auto p-4 space-y-4">
              {/* Emergency button (feature-flagged + urgent priority fallback) */}
              <EmergencyButton ticket={ticket} />

              {/* Status change */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Statut</label>
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

              {/* Smart Dispatcher with selected messages */}
              <SmartDispatcher
                ticket={ticket}
                activities={activities || []}
                onDispatched={handleRefresh}
                selectedMessageIds={selectedMessages}
              />

              {/* Duplicate button */}
              <Button
                variant="outline"
                className="w-full gap-2 text-xs"
                onClick={handleMarkDuplicate}
              >
                <Link2 className="h-3.5 w-3.5" /> Marquer comme doublon
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default TicketDetail;
