import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { Ticket } from '@/types';
import { cn } from '@/lib/utils';

interface Building {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
}

interface TicketsPortfolioProps {
  buildings: Building[];
  tickets: Ticket[];
  selectedBuildingId: string | null;
  onBuildingSelect: (buildingId: string | null) => void;
  loading?: boolean;
}

function getBuildingHealth(openCount: number, totalCount: number): {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  icon: React.ElementType;
} {
  if (totalCount === 0) return { color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', label: 'Sain', icon: CheckCircle };
  const ratio = openCount / Math.max(totalCount, 1);
  if (ratio > 0.5) return { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', label: 'Critique', icon: AlertTriangle };
  if (ratio > 0.25) return { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', label: 'Attention', icon: Clock };
  return { color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', label: 'Bon', icon: CheckCircle };
}

export function TicketsPortfolio({
  buildings,
  tickets,
  selectedBuildingId,
  onBuildingSelect,
  loading,
}: TicketsPortfolioProps) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[180px] h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (buildings.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Vue d'ensemble des sites
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {/* "All" card */}
        <Card
          className={cn(
            'min-w-[160px] max-w-[200px] cursor-pointer transition-all duration-200 rounded-xl border-2',
            !selectedBuildingId
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/50 hover:border-border hover:shadow-sm'
          )}
          onClick={() => onBuildingSelect(null)}
        >
          <CardContent className="p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground truncate">Tous les sites</span>
            </div>
            <div className="text-lg font-bold text-foreground">{tickets.length}</div>
            <p className="text-[10px] text-muted-foreground">tickets au total</p>
          </CardContent>
        </Card>

        {buildings.map((building) => {
          const buildingTickets = tickets.filter(t => t.building_id === building.id);
          const openTickets = buildingTickets.filter(t => ['open', 'in_progress', 'waiting'].includes(t.status));
          const health = getBuildingHealth(openTickets.length, buildingTickets.length);
          const HealthIcon = health.icon;
          const isSelected = selectedBuildingId === building.id;

          return (
            <Card
              key={building.id}
              className={cn(
                'min-w-[180px] max-w-[220px] cursor-pointer transition-all duration-200 rounded-xl border-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/50 hover:border-border hover:shadow-sm'
              )}
              onClick={() => onBuildingSelect(isSelected ? null : building.id)}
            >
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', health.bgColor)}>
                    <HealthIcon className={cn('h-3.5 w-3.5', health.color)} />
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate">{building.name}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-foreground">{openTickets.length}</span>
                  <span className="text-[10px] text-muted-foreground">ouverts</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">/ {buildingTickets.length}</span>
                </div>
                <div className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border', health.bgColor, health.color, health.borderColor)}>
                  {health.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
