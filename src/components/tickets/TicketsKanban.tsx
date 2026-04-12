import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Ticket } from '@/types';
import type { TicketStatus } from '@/types';
import { URGENCY_CONFIG, STATUS_CONFIG } from './TicketsList';
import { Calendar, MapPin, User, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { extractSubject } from '@/utils/ticketUtils';

interface TicketsKanbanProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  loading?: boolean;
  canChangeStatus?: boolean;
}

const KANBAN_COLUMNS: { key: TicketStatus; label: string }[] = [
  { key: 'open' as TicketStatus, label: 'Ouvert' },
  { key: 'in_progress' as TicketStatus, label: 'En cours' },
  { key: 'waiting' as TicketStatus, label: 'En attente' },
  { key: 'resolved' as TicketStatus, label: 'Résolu' },
  { key: 'closed' as TicketStatus, label: 'Fermé' },
];

function KanbanCard({
  ticket,
  onClick,
  onDragStart,
  onDragEnd,
  canChangeStatus = true,
}: {
  ticket: Ticket;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  canChangeStatus?: boolean;
}) {
  const urgency =
    URGENCY_CONFIG[(ticket.priority as keyof typeof URGENCY_CONFIG)] ??
    URGENCY_CONFIG.medium;

  return (
    <Card
      draggable={canChangeStatus}
      onDragStart={canChangeStatus ? onDragStart : undefined}
      onDragEnd={canChangeStatus ? onDragEnd : undefined}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 rounded-lg border border-border/60",
        canChangeStatus && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: urgency.text }}
      />
      <CardContent className="pl-4 pr-3 py-3 space-y-1.5">
        <h4 className="text-xs font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {extractSubject(ticket.title)}
        </h4>

        {/* Site & Organisation */}
        {(ticket.building_name || ticket.organization_name) && (
          <div className="flex flex-col gap-0.5">
            {ticket.building_name && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-full">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                {ticket.building_name}
              </span>
            )}
            {ticket.organization_name && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-full">
                <Building2 className="h-2.5 w-2.5 shrink-0" />
                {ticket.organization_name}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Calendar className="h-2.5 w-2.5" />
            {formatDistanceToNow(new Date(ticket.last_interaction_at), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
          {ticket.reporter_name && (
            <span className="inline-flex items-center gap-0.5 truncate max-w-[80px]">
              <User className="h-2.5 w-2.5" />
              {ticket.reporter_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TicketsKanban({
  tickets,
  onTicketClick,
  onStatusChange,
  loading,
  canChangeStatus = true,
}: TicketsKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    setDraggedId(ticketId);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', ticketId);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setDragOverColumn(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colKey) {
      setDragOverColumn(colKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column element itself (not a child)
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    const ticketId = draggedId || e.dataTransfer.getData('text/plain');
    if (ticketId) {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket && ticket.status !== colKey) {
        onStatusChange(ticketId, colKey as TicketStatus);
      }
    }
    setDraggedId(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.key} className="space-y-3">
            <div className="h-8 bg-muted rounded-lg animate-pulse" />
            <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 min-h-[60vh]">
      {KANBAN_COLUMNS.map((col) => {
        const statusCfg =
          STATUS_CONFIG[col.key as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open;
        const colTickets = tickets.filter((t) => t.status === col.key);
        const isOver = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            className={cn(
              'flex flex-col rounded-xl border border-border/50 bg-muted/30 transition-colors duration-200',
              isOver && 'bg-primary/5 border-primary/30 ring-2 ring-primary/20'
            )}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border"
                style={{
                  backgroundColor: statusCfg.bg,
                  color: statusCfg.text,
                  borderColor: statusCfg.border,
                }}
              >
                {React.createElement(statusCfg.icon, { className: 'h-3 w-3' })}
                {col.label}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium ml-auto">
                {colTickets.length}
              </span>
            </div>

            {/* Column content */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              {colTickets.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-8 italic">
                  {isOver ? 'Déposer ici' : 'Aucun ticket'}
                </p>
              )}
              {colTickets.map((ticket) => (
                <KanbanCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => onTicketClick(ticket)}
                  onDragStart={(e) => handleDragStart(e, ticket.id)}
                  onDragEnd={handleDragEnd}
                  canChangeStatus={canChangeStatus}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
