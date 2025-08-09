import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LocationElements } from './LocationElements';
import { LocationGroups } from './LocationGroups';
import { LocationEnsembles } from './LocationEnsembles';
import { TagsManagement } from './TagsManagement';
import { BuildingsManagement } from './BuildingsManagement';

export interface LocationTag {
  id: string;
  name: string;
  color: string;
  organization_id: string;
  created_at: string;
}

export interface LocationElement {
  id: string;
  name: string;
  description?: string;
  location_data?: any;
  organization_id: string;
  created_at: string;
  updated_at: string;
  tags?: LocationTag[];
}

export interface LocationGroup {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  elements?: LocationElement[];
  tags?: LocationTag[];
}

export interface LocationEnsemble {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  groups?: LocationGroup[];
  tags?: LocationTag[];
}

export const LocationsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  const fetchUserOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setUserOrganizations(data || []);
      if (data && data.length > 0) {
        setSelectedOrganization(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les organisations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!selectedOrganization && userOrganizations.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Aucune organisation disponible</h3>
            <p className="text-muted-foreground mb-4">
              Vous devez d'abord créer une organisation pour gérer vos lieux.
            </p>
            <p className="text-sm text-muted-foreground">
              Contactez votre administrateur pour créer une organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Lieux</CardTitle>
          <CardDescription>
            Créez et gérez vos lieux : éléments → groupements → ensembles
          </CardDescription>
        </CardHeader>
        {selectedOrganization && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Organisation actuelle</label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{userOrganizations.find(o => o.id === selectedOrganization)?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez maintenant gérer les lieux de cette organisation
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="elements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="elements">Éléments</TabsTrigger>
          <TabsTrigger value="groupements">Groupements</TabsTrigger>
          <TabsTrigger value="ensembles">Ensembles</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>


        <TabsContent value="elements" className="space-y-4">
          {selectedOrganization ? (
            <LocationElements organizationId={selectedOrganization} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Aucune organisation disponible pour créer des éléments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groupements" className="space-y-4">
          {selectedOrganization ? (
            <LocationGroups organizationId={selectedOrganization} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Aucune organisation disponible pour créer des groupements</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ensembles" className="space-y-4">
          {selectedOrganization ? (
            <LocationEnsembles organizationId={selectedOrganization} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Aucune organisation disponible pour créer des ensembles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          {selectedOrganization ? (
            <TagsManagement organizationId={selectedOrganization} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Aucune organisation disponible pour créer des tags</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};