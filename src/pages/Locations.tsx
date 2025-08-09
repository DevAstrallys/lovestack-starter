import React from 'react';
import { LocationsManagement } from '@/components/locations/LocationsManagement';
import { NavigationHeader } from '@/components/ui/navigation-header';

export const Locations: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <NavigationHeader 
        title="Gestion des Lieux" 
        description="Créez et gérez vos bâtiments et organisez vos lieux" 
      />
      <LocationsManagement />
    </div>
  );
};