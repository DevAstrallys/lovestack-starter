import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Pause,
  MessageSquare,
  Calendar,
  MapPin,
  Tag,
  CircleDot
} from 'lucide-react';
import type { Ticket } from '@/types';
import { TICKET_STATUSES, TICKET_PRIORITIES, extractSubject } from '@/utils/ticketUtils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TicketsListProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  loading?: boolean;
}

// ── Urgency config (pastel) ──────────────────────────────────────────
export const URGENCY_CONFIG = {
  urgent: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', label: '4 – Urgent', dot: '🔴' },
  high:   { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA', label: '3 – Élevée', dot: '🟠' },
  medium: { bg: '#FEF9C3', text: '#CA8A04', border: '#FDE68A', label: '2 – Moyenne', dot: '🟡' },
  low:    { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0', label: '1 – Faible', dot: '🟢' },
} as const;

// ── Status config (tags) ─────────────────────────────────────────────
export const STATUS_CONFIG = {
  open:        { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE', icon: CircleDot,    label: 'Ouvert' },
  in_progress: { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE', icon: Clock,        label: 'En cours' },
  waiting:     { bg: '#F5F5F4', text: '#78716C', border: '#E7E5E4', icon: Pause,         label: 'En attente' },
  resolved:    { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0', icon: CheckCircle,   label: 'Résolu' },
  closed:      { bg: '#E5E7EB', text: '#4B5563', border: '#D1D5DB', icon: XCircle,       label: 'Fermé' },
} as const;

const getUrgency = (priority: string | null) =>
  URGENCY_CONFIG[(priority as keyof typeof URGENCY_CONFIG)] ?? URGENCY_CONFIG.medium;

const getStatus = (status: string) =>
  STATUS_CONFIG[(status as keyof typeof STATUS_CONFIG)] ?? STATUS_CONFIG.open;

export function TicketsList({ tickets, onTicketClick, loading }: TicketsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border bg-card p-5">
            <div className="flex items-start gap-4">
              <div className="h-3 w-1 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded-full w-16" />
                  <div className="h-5 bg-muted rounded-full w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-2xl bg-muted/50 p-6 mb-4">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">Aucun ticket trouvé</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Aucun ticket ne correspond aux critères de recherche actuels.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const urgency = getUrgency(ticket.priority);
        const status = getStatus(ticket.status);
        const StatusIcon = status.icon;

        return (
          <Card
            key={ticket.id}
            className="group relative overflow-hidden border border-border/60 hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer rounded-xl"
            onClick={() => onTicketClick(ticket)}
          >
            {/* Left urgency bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ backgroundColor: urgency.text }}
            />

            <CardContent className="pl-5 pr-4 py-4">
              <div className="flex items-start gap-3">
                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {extractSubject(ticket.title)}
                  </h3>

                  {/* Building & Organization */}
                  {(ticket.building_name || ticket.organization_name) && (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {ticket.building_name && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {ticket.building_name}
                        </span>
                      )}
                      {ticket.organization_name && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <Tag className="h-3 w-3 shrink-0" />
                          {ticket.organization_name}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description preview */}
                  {ticket.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                      {ticket.description}
                    </p>
                  )}

                  {/* Tags row */}
                  <div className="flex items-center flex-wrap gap-1.5">
                    {/* Status tag */}
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
                      style={{
                        backgroundColor: status.bg,
                        color: status.text,
                        borderColor: status.border,
                      }}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>

                    {/* Urgency tag */}
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
                      style={{
                        backgroundColor: urgency.bg,
                        color: urgency.text,
                        borderColor: urgency.border,
                      }}
                    >
                      {urgency.label}
                    </span>

                    {/* Category / Nature */}
                    {(ticket.category_code || ticket.nature_code) && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground border border-border/50">
                        <Tag className="h-2.5 w-2.5" />
                        {ticket.category_code}
                        {ticket.category_code && ticket.nature_code && ' · '}
                        {ticket.nature_code}
                      </span>
                    )}

                    {/* Attachments */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground border border-border/50">
                        📎 {ticket.attachments.length}
                      </span>
                    )}
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(ticket.last_interaction_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>

                    {ticket.location && typeof ticket.location === 'object' && 'element_name' in ticket.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {String(ticket.location.element_name)}
                      </span>
                    )}

                    {ticket.reporter_name && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.reporter_name}
                      </span>
                    )}

                    {ticket.assigned_to && (
                      <span className="inline-flex items-center gap-1 text-primary/70">
                        <User className="h-3 w-3" />
                        Assigné
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
