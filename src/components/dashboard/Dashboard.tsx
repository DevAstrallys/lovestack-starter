import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Ticket, 
  FileText, 
  BarChart3, 
  Settings, 
  Users,
  MessageSquare,
  MapPin,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

// ── KPI Cards ────────────────────────────────────────────────────────
interface KpiData {
  openCount: number;
  urgentCount: number;
  todayCount: number;
  closeRate: number;
}

function useKpiData(orgId: string | null): { kpi: KpiData; loading: boolean } {
  const [kpi, setKpi] = useState<KpiData>({ openCount: 0, urgentCount: 0, todayCount: 0, closeRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch all tickets (limited to org if selected)
        let query = supabase.from('tickets').select('status, priority, created_at', { count: 'exact' });
        
        if (orgId) {
          const { data: buildings } = await supabase.from('buildings').select('id').eq('organization_id', orgId);
          const bIds = (buildings || []).map(b => b.id);
          if (bIds.length > 0) {
            query = query.in('building_id', bIds);
          }
        }

        const { data: tickets } = await query;
        if (!tickets) { setLoading(false); return; }

        const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting');
        const urgent = tickets.filter(t => t.status !== 'closed' && t.status !== 'canceled' && t.priority === 'urgent');
        const today = new Date().toISOString().slice(0, 10);
        const todayTickets = tickets.filter(t => t.created_at?.slice(0, 10) === today);
        const total = tickets.length;
        const closed = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;

        setKpi({
          openCount: open.length,
          urgentCount: urgent.length,
          todayCount: todayTickets.length,
          closeRate: total > 0 ? Math.round((closed / total) * 100) : 0,
        });
      } catch (e) {
        console.error('KPI load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId]);

  return { kpi, loading };
}

const KPI_CARDS = [
  { key: 'openCount' as const, label: 'Tickets ouverts', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', href: '/tickets?status=open,in_progress,waiting' },
  { key: 'urgentCount' as const, label: 'Urgences en cours', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', href: '/tickets?priority=urgent' },
  { key: 'todayCount' as const, label: 'Créés aujourd\'hui', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', href: '/tickets?created=today' },
  { key: 'closeRate' as const, label: 'Taux de clôture', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', suffix: '%', href: '/tickets?status=closed,resolved' },
];

// ── Modules grid ─────────────────────────────────────────────────────
const modules = [
  { id: 'locations', name: 'Gestion des Lieux', description: 'Ensembles, groupements, éléments', icon: MapPin, gradient: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100', path: '/locations', ready: true },
  { id: 'ticketing', name: 'Tickets', description: 'Demandes d\'intervention', icon: Ticket, gradient: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-600', iconBg: 'bg-blue-100', path: '/tickets', ready: true },
  { id: 'users', name: 'Utilisateurs', description: 'Accès et rôles', icon: Users, gradient: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-600', iconBg: 'bg-violet-100', path: '/users', ready: true },
  { id: 'documents', name: 'Documents', description: 'Centraliser vos documents', icon: FileText, gradient: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-600', iconBg: 'bg-amber-100', path: '/documents', ready: false },
  { id: 'reporting', name: 'Rapports', description: 'Analyser les données', icon: BarChart3, gradient: 'from-orange-500/10 to-orange-500/5', iconColor: 'text-orange-600', iconBg: 'bg-orange-100', path: '/reports', ready: false },
  { id: 'communication', name: 'Communication', description: 'Notifications et messages', icon: MessageSquare, gradient: 'from-teal-500/10 to-teal-500/5', iconColor: 'text-teal-600', iconBg: 'bg-teal-100', path: '/communication', ready: false },
];

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedOrganization } = useOrganization();
  const { kpi, loading: kpiLoading } = useKpiData(selectedOrganization?.id || null);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Utilisateur';

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Bonjour, {firstName}</h1>
        <p className="text-muted-foreground text-base">
          {selectedOrganization ? `Espace de travail — ${selectedOrganization.name}` : 'Vue globale de la plateforme'}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ key, label, icon: Icon, color, bg, suffix, href }) => (
          <Card
            key={key}
            className="group border border-border/60 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => navigate(href)}
          >
            <CardContent className="p-5 flex items-center gap-4 relative">
              <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold tracking-tight">
                  {kpiLoading ? '—' : `${kpi[key]}${suffix || ''}`}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-4 bottom-4" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card
                key={mod.id}
                className={`group relative overflow-hidden cursor-pointer border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${!mod.ready ? 'opacity-60' : ''}`}
                onClick={() => {
                  if (mod.ready) navigate(mod.path);
                  else toast.info(`Module ${mod.name} — En développement`);
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardContent className="relative p-5 space-y-3">
                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${mod.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-foreground">{mod.name}</h3>
                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                  </div>
                  <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {mod.ready ? 'Accéder' : 'Bientôt disponible'}
                    {mod.ready && <ArrowRight className="ml-1 h-3 w-3" />}
                  </div>
                </CardContent>
                {!mod.ready && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Bientôt</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
