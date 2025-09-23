import React from 'react';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useOrganization } from '@/contexts/OrganizationContext';

export const Users: React.FC = () => {
  const { selectedOrganization, isplatformAdmin } = useOrganization();

  return (
    <div className="container mx-auto px-4 py-8">
      <NavigationHeader 
        title="Administration des Utilisateurs" 
        description={`Gestion globale des utilisateurs et de leurs accès plateforme${selectedOrganization ? ` - ${selectedOrganization.name}` : ''}`}
      />
      
      {/* Organization Selector for Platform Admins */}
      {isplatformAdmin && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Sélection d'Organisation</CardTitle>
            <CardDescription>
              Choisissez l'organisation dont vous souhaitez gérer les utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationSelector />
          </CardContent>
        </Card>
      )}
      
      <UsersManagement />
    </div>
  );
};