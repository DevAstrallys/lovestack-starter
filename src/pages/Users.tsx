import React from 'react';
import { LocationUsersManagement } from '@/components/locations/LocationUsersManagement';
import { NavigationHeader } from '@/components/ui/navigation-header';

export const Users: React.FC = () => {
  // Pour l'instant, on utilise un organizationId fixe
  // Dans un vrai système, cela viendrait du contexte utilisateur
  const organizationId = "550e8400-e29b-41d4-a716-446655440000";

  return (
    <div className="container mx-auto px-4 py-8">
      <NavigationHeader 
        title="Gestion des Utilisateurs" 
        description="Gérez les utilisateurs et leurs accès aux lieux dans votre organisation" 
      />
      <LocationUsersManagement organizationId={organizationId} />
    </div>
  );
};