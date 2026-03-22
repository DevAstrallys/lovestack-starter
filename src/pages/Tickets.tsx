import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Search, List, Columns } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TicketCreateForm } from '@/components/tickets/TicketCreateForm';
import { TicketsList } from '@/components/tickets/TicketsList';
import { TicketsKanban } from '@/components/tickets/TicketsKanban';
import { TicketsPortfolio } from '@/components/tickets/TicketsPortfolio';
import { TicketQuickFilters } from '@/components/tickets/TicketQuickFilters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useTickets, TicketFilters as ITicketFilters, Ticket, TicketStatus } from '@/hooks/useTickets';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTicketRole } from '@/hooks/useUserTicketRole';
import { fetchOrganizationEnsembles } from '@/services/tickets';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { notifyStatusChange } from '@/services/tickets/notifications';
import { extractSubject } from '@/utils/ticketUtils';
import { createLogger } from '@/lib/logger';

const log = createLogger('page:tickets');

type ViewMode = 'list' | 'kanban';

interface Ensemble {
  id: string;
  name: string;
  description?: string | null;
}

export const Tickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedOrganization, loading: orgLoading, isplatformAdmin } = useOrganization();
  const { canViewAllOrgTickets, canViewOwnOnly, canViewAssignedOnly, canManageTicket, loading: roleLoading } = useUserTicketRole();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ITicketFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);

  // Load buildings for the selected organization
  useEffect(() => {
    if (!selectedOrganization) {
      setBuildings([]);
      return;
    }
    const load = async () => {
      setBuildingsLoading(true);
      try {
        const { data } = await supabase
          .from('buildings')
          .select('id, name, address, city')
          .eq('organization_id', selectedOrganization.id)
          .eq('is_active', true)
          .order('name');
        setBuildings(data || []);
      } catch (err) {
        log.error('Failed to load buildings', err);
      } finally {
        setBuildingsLoading(false);
      }
    };
    load();
  }, [selectedOrganization?.id]);

  // Build filters based on role
  const ticketFilters: ITicketFilters = {
    ...filters,
    ...(selectedOrganization ? { organizationId: selectedOrganization.id } : {}),
    // Role-based scoping
    ...(canViewOwnOnly && user ? { createdBy: user.id } : {}),
    ...(canViewAssignedOnly && user ? { assignedTo: user.id } : {}),
  };
    
  const { tickets, loading, totalCount, refresh, updateTicket } = useTickets(ticketFilters);

  // Filter tickets by selected building (client-side for instant feedback)
  const displayedTickets = selectedBuildingId
    ? tickets.filter(t => t.building_id === selectedBuildingId)
    : tickets;

  const handleFiltersChange = (newFilters: ITicketFilters) => setFilters(newFilters);
  const handleTicketClick = (ticket: Ticket) => navigate(`/tickets/${ticket.id}`);

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!canManageTicket) {
      toast.error('Vous n\'avez pas les droits pour modifier le statut');
      return;
    }
    try {
      const oldStatus = ticket?.status || 'open';
      await updateTicket(ticketId, { status: newStatus });
      toast.success('Statut mis à jour');

      // Send notification to reporter
      if (ticket) {
        notifyStatusChange({
          ticketId,
          ticketTitle: extractSubject(ticket.title),
          oldStatus,
          newStatus,
          reporterEmail: ticket.reporter_email,
          reporterName: ticket.reporter_name,
          communicationMode: ticket.communication_mode,
        });
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (orgLoading || roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  if (!selectedOrganization && !isplatformAdmin) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune organisation sélectionnée</h3>
              <p className="text-muted-foreground">
                Vous devez être assigné à une organisation pour voir les tickets.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tickets{selectedOrganization ? ` — ${selectedOrganization.name}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {canViewOwnOnly && 'Vos demandes'}
              {canViewAssignedOnly && 'Tickets qui vous sont assignés'}
              {canViewAllOrgTickets && 'Gérez les demandes et interventions'}
            </p>
          </div>
        </div>

        {/* Portfolio view — only for managers */}
        {canViewAllOrgTickets && (
          <TicketsPortfolio
            buildings={buildings}
            tickets={tickets}
            selectedBuildingId={selectedBuildingId}
            onBuildingSelect={setSelectedBuildingId}
            loading={buildingsLoading}
          />
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ticket..."
              value={filters.search || ''}
              onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value || undefined })}
              className="pl-9 h-10 rounded-lg"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-3.5 w-3.5" /> Liste
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                viewMode === 'kanban'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Columns className="h-3.5 w-3.5" /> Kanban
            </button>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="default" className="rounded-lg">
                <Plus className="w-4 h-4 mr-1.5" />
                Nouveau ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une demande</DialogTitle>
              </DialogHeader>
              <TicketCreateForm 
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  refresh();
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick filters */}
        <TicketQuickFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Count */}
        <p className="text-xs text-muted-foreground">
          {displayedTickets.length} ticket{displayedTickets.length !== 1 ? 's' : ''} trouvé{displayedTickets.length !== 1 ? 's' : ''}
          {selectedBuildingId && ` (filtré par site)`}
          {loading && ' · Chargement...'}
        </p>

        {/* View */}
        {viewMode === 'list' ? (
          <TicketsList 
            tickets={displayedTickets}
            onTicketClick={handleTicketClick}
            loading={loading}
          />
        ) : (
          <TicketsKanban
            tickets={displayedTickets}
            onTicketClick={handleTicketClick}
            onStatusChange={handleStatusChange}
            loading={loading}
            canChangeStatus={canManageTicket}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Tickets;
