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
  building_id: string;
  created_at: string;
}

export interface LocationElement {
  id: string;
  name: string;
  description?: string;
  location_data?: any;
  building_id: string;
  created_at: string;
  updated_at: string;
  tags?: LocationTag[];
}

export interface LocationGroup {
  id: string;
  name: string;
  description?: string;
  building_id: string;
  created_at: string;
  updated_at: string;
  elements?: LocationElement[];
  tags?: LocationTag[];
}

export interface LocationEnsemble {
  id: string;
  name: string;
  description?: string;
  building_id: string;
  created_at: string;
  updated_at: string;
  groups?: LocationGroup[];
  tags?: LocationTag[];
}

export const LocationsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userBuildings, setUserBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUserBuildings();
  }, []);

  const fetchUserBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setUserBuildings(data || []);
      if (data && data.length > 0) {
        setSelectedBuilding(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les bâtiments",
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

  if (!selectedBuilding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Lieux</CardTitle>
          <CardDescription>
            Aucun bâtiment disponible. Vous devez d'abord créer un bâtiment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Lieux</CardTitle>
          <CardDescription>
            Créez et gérez vos bâtiments et organisez une hiérarchie flexible de lieux : éléments → groupements → ensembles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedBuilding && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bâtiment sélectionné</label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{userBuildings.find(b => b.id === selectedBuilding)?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez maintenant gérer les lieux de ce bâtiment
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="buildings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="buildings">Bâtiments</TabsTrigger>
          <TabsTrigger value="elements">Éléments</TabsTrigger>
          <TabsTrigger value="groupements">Groupements</TabsTrigger>
          <TabsTrigger value="ensembles">Ensembles</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="buildings" className="space-y-4">
          <BuildingsManagement onBuildingSelect={setSelectedBuilding} />
        </TabsContent>

        <TabsContent value="elements" className="space-y-4">
          <LocationElements buildingId={selectedBuilding} />
        </TabsContent>

        <TabsContent value="groupements" className="space-y-4">
          <LocationGroups buildingId={selectedBuilding} />
        </TabsContent>

        <TabsContent value="ensembles" className="space-y-4">
          <LocationEnsembles buildingId={selectedBuilding} />
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <TagsManagement buildingId={selectedBuilding} />
        </TabsContent>
      </Tabs>
    </div>
  );
};