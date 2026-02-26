import { useState } from 'react';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TicketCreateForm } from '@/components/tickets/TicketCreateForm';
import { TicketsList } from '@/components/tickets/TicketsList';
import { TicketQuickFilters } from '@/components/tickets/TicketQuickFilters';
import { TicketDetailDialog } from '@/components/tickets/TicketDetailDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { useTickets, TicketFilters as ITicketFilters, Ticket } from '@/hooks/useTickets';
import { useOrganization } from '@/contexts/OrganizationContext';

export const Tickets = () => {
  const { selectedOrganization, loading: orgLoading, isplatformAdmin } = useOrganization();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ITicketFilters>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Ajouter l'organisation aux filtres si sélectionnée
  const ticketFilters = selectedOrganization 
    ? { ...filters, organizationId: selectedOrganization.id }
    : filters;
    
  const { tickets, loading, totalCount, refresh } = useTickets(ticketFilters);

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // Pour les non-admins sans organisation sélectionnée, afficher un message
  if (!selectedOrganization && !isplatformAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader 
          title="Gestion des Tickets" 
          description="Gérez les demandes et interventions"
        />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune organisation sélectionnée</h3>
              <p className="text-muted-foreground mb-4">
                Vous devez être assigné à une organisation pour voir les tickets.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleFiltersChange = (newFilters: ITicketFilters) => {
    setFilters(newFilters);
  };

  const handleFiltersReset = () => {
    setFilters({});
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        title={`Tickets${selectedOrganization ? ` – ${selectedOrganization.name}` : ''}`}
        description="Gérez les demandes et interventions"
      />
      
      {/* Sélecteur d'organisation pour les admins plateforme */}
      {isplatformAdmin && (
        <div className="container mx-auto px-4 pt-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Organisation:</span>
                <OrganizationSelector />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-6 space-y-4">
        {/* Top bar: search + create */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ticket..."
              value={filters.search || ''}
              onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value || undefined })}
              className="pl-9 h-9 rounded-lg"
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg h-9">
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

        {/* Quick filters bar */}
        <TicketQuickFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Ticket count */}
        <p className="text-xs text-muted-foreground">
          {totalCount} ticket{totalCount !== 1 ? 's' : ''} trouvé{totalCount !== 1 ? 's' : ''}
          {loading && ' · Chargement...'}
        </p>

        {/* Tickets list */}
        <TicketsList 
          tickets={tickets}
          onTicketClick={handleTicketClick}
          loading={loading}
        />
      </main>

      <TicketDetailDialog
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}
      />
    </div>
  );
};

export default Tickets;