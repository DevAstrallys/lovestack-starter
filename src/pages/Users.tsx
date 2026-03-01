import React from 'react';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { AppLayout } from '@/components/layout/AppLayout';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useOrganization } from '@/contexts/OrganizationContext';

export const Users: React.FC = () => {
  const { selectedOrganization, isplatformAdmin } = useOrganization();

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des utilisateurs et de leurs accès
            {selectedOrganization ? ` — ${selectedOrganization.name}` : ''}
          </p>
        </div>
        
        {isplatformAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Organisation</CardTitle>
              <CardDescription className="text-sm">
                Sélectionnez l'organisation à gérer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSelector />
            </CardContent>
          </Card>
        )}
        
        <UsersManagement />
      </div>
    </AppLayout>
  );
};
