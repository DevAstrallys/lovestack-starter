import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationElements } from './LocationElements';
import { LocationGroups } from './LocationGroups';
import { LocationEnsembles } from './LocationEnsembles';
import { TagsManagement } from './TagsManagement';

import { LocationUsersManagement } from './LocationUsersManagement';
import { QRCodeLocationManager } from './QRCodeLocationManager';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { useOrganization } from '@/contexts/OrganizationContext';
import { AlertCircle } from 'lucide-react';


export const LocationsManagement: React.FC = () => {
  const { selectedOrganization, setSelectedOrganization, organizations, loading, isplatformAdmin } = useOrganization();

  // Auto-select first org for platform admins when none is selected
  React.useEffect(() => {
    if (!loading && isplatformAdmin && !selectedOrganization && organizations.length > 0) {
      setSelectedOrganization(organizations[0]);
    }
  }, [loading, isplatformAdmin, selectedOrganization, organizations, setSelectedOrganization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!selectedOrganization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune organisation sélectionnée</h3>
            <p className="text-muted-foreground mb-4">
              {isplatformAdmin 
                ? "Sélectionnez une organisation pour gérer ses lieux." 
                : "Vous devez être assigné à une organisation pour gérer les lieux."}
            </p>
            <p className="text-sm text-muted-foreground">
              {!isplatformAdmin && "Contactez votre administrateur pour être assigné à une organisation."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sélecteur d'organisation pour les admins plateforme */}
      {isplatformAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Sélection d'Organisation</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Choisissez l'organisation dont vous souhaitez gérer les lieux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationSelector />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Gestion des Lieux</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Créez et gérez vos lieux : éléments → groupements → ensembles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Organisation actuelle</label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium text-sm sm:text-base">{selectedOrganization.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {selectedOrganization.description || "Vous pouvez maintenant gérer les lieux de cette organisation"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="elements" className="space-y-4">
        <div className="w-full overflow-x-auto">
          <TabsList className="grid w-full min-w-[480px] grid-cols-6 h-auto p-1">
            <TabsTrigger value="elements" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <span>Éléments</span>
            </TabsTrigger>
            <TabsTrigger value="groupements" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <span className="hidden sm:inline">Groupements</span>
              <span className="sm:hidden">Groupe.</span>
            </TabsTrigger>
            <TabsTrigger value="ensembles" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <span>Ensembles</span>
            </TabsTrigger>
            <TabsTrigger value="qrcodes" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <span className="hidden sm:inline">QR Codes</span>
              <span className="sm:hidden">QR</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <span className="hidden sm:inline">Utilisateurs</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <span>Tags</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="elements" className="space-y-4">
          <LocationElements organizationId={selectedOrganization.id} />
        </TabsContent>

        <TabsContent value="groupements" className="space-y-4">
          <LocationGroups organizationId={selectedOrganization.id} />
        </TabsContent>

        <TabsContent value="ensembles" className="space-y-4">
          <LocationEnsembles organizationId={selectedOrganization.id} />
        </TabsContent>

        <TabsContent value="qrcodes" className="space-y-4">
          <QRCodeLocationManager organizationId={selectedOrganization.id} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <LocationUsersManagement organizationId={selectedOrganization.id} />
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <TagsManagement organizationId={selectedOrganization.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};