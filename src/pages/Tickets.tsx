import { useState } from 'react';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { TicketCreateForm } from '@/components/tickets/TicketCreateForm';
import { TicketsList } from '@/components/tickets/TicketsList';
import { TicketFilters } from '@/components/tickets/TicketFilters';
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

  if (!selectedOrganization) {
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
                {isplatformAdmin 
                  ? "Sélectionnez une organisation pour voir ses tickets." 
                  : "Vous devez être assigné à une organisation pour voir les tickets."}
              </p>
              {isplatformAdmin && (
                <div className="flex justify-center mt-6">
                  <OrganizationSelector />
                </div>
              )}
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
    // TODO: Open ticket detail dialog or navigate to ticket detail page
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        title={`Gestion des Tickets - ${selectedOrganization.name}`}
        description={`${totalCount} ticket${totalCount !== 1 ? 's' : ''} trouvé${totalCount !== 1 ? 's' : ''}`}
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
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar with filters */}
          <div className="w-80 flex-shrink-0">
            <TicketFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleFiltersReset}
            />
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Tickets {loading && '(Chargement...)'}
              </h2>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un ticket
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

            <TicketsList 
              tickets={tickets}
              onTicketClick={handleTicketClick}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tickets;