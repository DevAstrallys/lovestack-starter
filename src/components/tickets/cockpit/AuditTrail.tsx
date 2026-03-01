import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, StickyNote } from 'lucide-react';
import { TicketActivity } from '@/hooks/useTickets';
import { Ticket } from '@/hooks/useTickets';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { businessHoursBetween, slaScore, slaColor, formatBusinessHours } from '@/utils/slaUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuditTrailProps {
  ticket: Ticket;
  activities: TicketActivity[];
  loading: boolean;
  onNoteAdded?: () => void;
}

export function AuditTrail({ ticket, activities, loading, onNoteAdded }: AuditTrailProps) {
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const { user } = useAuth();

  const nonReplyActivities = activities.filter(a => a.activity_type !== 'reply');

  // Build system timeline entries
  const systemEntries: { time: string; label: string; icon: string }[] = [];

  systemEntries.push({
    time: ticket.created_at,
    label: '📍 Ticket reçu',
    icon: '📥',
  });

  const ticketAny = ticket as any;

  if (ticketAny.first_opened_at) {
    systemEntries.push({
      time: ticketAny.first_opened_at,
      label: '📍 Ouvert par le gestionnaire',
      icon: '👁️',
    });
  }

  if (ticketAny.first_responded_at) {
    const bh = businessHoursBetween(new Date(ticket.created_at), new Date(ticketAny.first_responded_at));
    systemEntries.push({
      time: ticketAny.first_responded_at,
      label: `📍 Première réponse après ${formatBusinessHours(bh)}`,
      icon: '💬',
    });
  }

  if (ticketAny.assigned_at) {
    systemEntries.push({
      time: ticketAny.assigned_at,
      label: '📍 Transféré à un tiers',
      icon: '🔄',
    });
  }

  if (ticketAny.resolved_at) {
    systemEntries.push({
      time: ticketAny.resolved_at,
      label: '📍 Résolu',
      icon: '✅',
    });
  }

  // SLA calculation
  const responseTime = ticketAny.first_responded_at
    ? businessHoursBetween(new Date(ticket.created_at), new Date(ticketAny.first_responded_at))
    : businessHoursBetween(new Date(ticket.created_at), new Date());
  const score = slaScore(responseTime);
  const hasResponded = !!ticketAny.first_responded_at;

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSending(true);
    try {
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        actor_id: user?.id || null,
        activity_type: 'comment',
        content: note.trim(),
        is_internal: true,
        metadata: { type: 'private_note' },
      });
      setNote('');
      toast.success('Note privée ajoutée');
      onNoteAdded?.();
    } catch {
      toast.error('Erreur');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* SLA KPI */}
      <div className="p-3 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            SLA — Délai de première réponse
          </span>
          <span className={`text-lg font-bold ${slaColor(score)}`}>
            {score}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {hasResponded
            ? `Répondu en ${formatBusinessHours(responseTime)}`
            : `En attente depuis ${formatBusinessHours(responseTime)}`
          }
          {' · '}Objectif : &lt; 24h ouvrées
        </p>
      </div>

      {/* System timeline */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Fil d'eau système
        </h4>
        <div className="space-y-2">
          {systemEntries.map((entry, i) => (
            <div key={i} className="flex gap-3 text-xs">
              <span className="text-base leading-none mt-0.5">{entry.icon}</span>
              <div className="flex-1">
                <p className="text-foreground">{entry.label}</p>
                <p className="text-muted-foreground">
                  {format(new Date(entry.time), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity changes (non-reply) */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : nonReplyActivities.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Changements
          </h4>
          <div className="space-y-2">
            {nonReplyActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3 text-xs">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-muted-foreground" />
                <div className="flex-1">
                  <p className="text-foreground">
                    {activity.activity_type === 'status_change' && (
                      <>Statut : <Badge variant="outline" className="text-[10px] mx-0.5">{activity.old_value}</Badge> → <Badge variant="outline" className="text-[10px] mx-0.5">{activity.new_value}</Badge></>
                    )}
                    {activity.activity_type === 'assignment' && 'Assignation modifiée'}
                    {activity.activity_type === 'priority_change' && (
                      <>Priorité : {activity.old_value} → {activity.new_value}</>
                    )}
                    {activity.activity_type === 'comment' && (
                      <span className={activity.is_internal ? 'bg-yellow-100 text-yellow-900 px-1.5 py-0.5 rounded' : ''}>
                        {activity.is_internal && <StickyNote className="h-3 w-3 inline mr-1" />}
                        {activity.content}
                      </span>
                    )}
                    {!['status_change', 'assignment', 'priority_change', 'comment'].includes(activity.activity_type) && activity.activity_type}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {activity.created_at && format(new Date(activity.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Private note form */}
      <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50/50">
        <h4 className="text-xs font-semibold text-yellow-800 mb-2 flex items-center gap-1.5">
          <StickyNote className="h-3 w-3" /> Note privée
        </h4>
        <div className="flex gap-2">
          <Textarea
            placeholder="Ajouter une note interne…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="resize-none flex-1 text-sm bg-white"
          />
          <Button onClick={handleAddNote} disabled={!note.trim() || sending} size="icon" className="h-11 w-11 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
