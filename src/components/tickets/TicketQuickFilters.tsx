import React from 'react';
import { TicketFilters as ITicketFilters } from '@/hooks/useTickets';
import type { TicketStatus, TicketPriority } from '@/types';
import { URGENCY_CONFIG, STATUS_CONFIG } from './TicketsList';
import { cn } from '@/lib/utils';

interface TicketQuickFiltersProps {
  filters: ITicketFilters;
  onFiltersChange: (filters: ITicketFilters) => void;
}

export function TicketQuickFilters({ filters, onFiltersChange }: TicketQuickFiltersProps) {
  const togglePriority = (p: string) => {
    const current = filters.priority || [];
    const next = current.includes(p as TicketPriority)
      ? current.filter(v => v !== p)
      : [...current, p as TicketPriority];
    onFiltersChange({ ...filters, priority: next.length ? next : undefined });
  };

  const toggleStatus = (s: string) => {
    const current = filters.status || [];
    const next = current.includes(s as TicketStatus)
      ? current.filter(v => v !== s)
      : [...current, s as TicketStatus];
    onFiltersChange({ ...filters, status: next.length ? next : undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Urgency pills */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-muted-foreground mr-1">Urgence</span>
        {(Object.entries(URGENCY_CONFIG) as [string, typeof URGENCY_CONFIG[keyof typeof URGENCY_CONFIG]][]).map(
          ([key, cfg]) => {
            const active = filters.priority?.includes(key as TicketPriority);
            return (
              <button
                key={key}
                onClick={() => togglePriority(key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all duration-150',
                  active ? 'ring-2 ring-offset-1 ring-ring shadow-sm' : 'opacity-60 hover:opacity-100'
                )}
                style={{
                  backgroundColor: cfg.bg,
                  color: cfg.text,
                  borderColor: active ? cfg.text : cfg.border,
                }}
              >
                <span className="text-xs">{cfg.dot}</span>
                {cfg.label.split(' – ')[1]}
              </button>
            );
          }
        )}
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Status pills */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-muted-foreground mr-1">Statut</span>
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(
          ([key, cfg]) => {
            const active = filters.status?.includes(key as TicketStatus);
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => toggleStatus(key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all duration-150',
                  active ? 'ring-2 ring-offset-1 ring-ring shadow-sm' : 'opacity-60 hover:opacity-100'
                )}
                style={{
                  backgroundColor: cfg.bg,
                  color: cfg.text,
                  borderColor: active ? cfg.text : cfg.border,
                }}
              >
                <Icon className="h-3 w-3" />
                {cfg.label}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
