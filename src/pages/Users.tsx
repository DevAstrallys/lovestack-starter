import React from 'react';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { NavigationHeader } from '@/components/ui/navigation-header';

export const Users: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <NavigationHeader 
        title="Administration des Utilisateurs" 
        description="Gestion globale des utilisateurs et de leurs accès plateforme (Super Admin)" 
      />
      <UsersManagement />
    </div>
  );
};