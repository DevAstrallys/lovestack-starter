import { useState } from 'react';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TicketCreateForm } from '@/components/tickets/TicketCreateForm';
import { TicketsList } from '@/components/tickets/TicketsList';
import { TicketFilters } from '@/components/tickets/TicketFilters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTickets, TicketFilters as ITicketFilters, Ticket } from '@/hooks/useTickets';

export const Tickets = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ITicketFilters>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  const { tickets, loading, totalCount, refresh } = useTickets(filters);

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
        title="Gestion des Tickets" 
        description={`${totalCount} ticket${totalCount !== 1 ? 's' : ''} trouvé${totalCount !== 1 ? 's' : ''}`}
      />
      
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