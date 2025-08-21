import { useState } from 'react';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TicketCreateForm } from '@/components/tickets/TicketCreateForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const Tickets = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        title="Gestion des Tickets" 
        description="Créer et suivre les demandes d'intervention" 
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div></div>
          
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
              <TicketCreateForm onSuccess={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des tickets sera ajoutée plus tard */}
        <div className="bg-card rounded-lg border p-6">
          <p className="text-center text-muted-foreground">
            La liste des tickets sera implémentée prochainement.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Tickets;