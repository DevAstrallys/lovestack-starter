import React from 'react';
import { LocationsManagement } from '@/components/locations/LocationsManagement';
import { AppLayout } from '@/components/layout/AppLayout';

export const Locations: React.FC = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Lieux</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez et organisez vos ensembles, groupements et éléments
          </p>
        </div>
        <LocationsManagement />
      </div>
    </AppLayout>
  );
};
