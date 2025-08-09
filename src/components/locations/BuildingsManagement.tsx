import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit,
  MapPin,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface Building {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  country: string | null;
  timezone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BuildingForm {
  name: string;
  address: string;
  city: string;
  zip_code: string;
  country: string;
  timezone: string;
}

interface BuildingsManagementProps {
  onBuildingSelect: (buildingId: string) => void;
}

export const BuildingsManagement: React.FC<BuildingsManagementProps> = ({ onBuildingSelect }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BuildingForm>({
    name: '',
    address: '',
    city: '',
    zip_code: '',
    country: 'FR',
    timezone: 'Europe/Paris'
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des bâtiments');
      console.error('Error fetching buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBuilding = async () => {
    try {
      const { error } = await supabase
        .from('buildings')
        .insert([formData]);

      if (error) throw error;
      
      toast.success('Bâtiment créé avec succès');
      fetchBuildings();
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        zip_code: '',
        country: 'FR',
        timezone: 'Europe/Paris'
      });
    } catch (error) {
      toast.error('Erreur lors de la création du bâtiment');
      console.error('Error creating building:', error);
    }
  };

  const handleEditBuilding = async () => {
    if (!selectedBuilding) return;

    try {
      const { error } = await supabase
        .from('buildings')
        .update(formData)
        .eq('id', selectedBuilding.id);

      if (error) throw error;
      
      toast.success('Bâtiment mis à jour avec succès');
      fetchBuildings();
      setIsEditDialogOpen(false);
      setSelectedBuilding(null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du bâtiment');
      console.error('Error updating building:', error);
    }
  };

  const toggleBuildingStatus = async (buildingId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('buildings')
        .update({ is_active: !currentStatus })
        .eq('id', buildingId);

      if (error) throw error;
      
      toast.success('Statut du bâtiment mis à jour');
      fetchBuildings();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
      console.error('Error updating building status:', error);
    }
  };

  const openEditDialog = (building: Building) => {
    setSelectedBuilding(building);
    setFormData({
      name: building.name,
      address: building.address || '',
      city: building.city || '',
      zip_code: building.zip_code || '',
      country: building.country || 'FR',
      timezone: building.timezone || 'Europe/Paris'
    });
    setIsEditDialogOpen(true);
  };

  const handleSelectBuilding = (building: Building) => {
    onBuildingSelect(building.id);
    toast.success(`Bâtiment "${building.name}" sélectionné`);
  };

  const filteredBuildings = buildings.filter(building => 
    building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestion des Bâtiments</h3>
          <p className="text-muted-foreground">
            Créez et gérez vos bâtiments, puis sélectionnez-en un pour organiser ses lieux
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau bâtiment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau bâtiment</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau bâtiment pour commencer à organiser ses lieux
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du bâtiment*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du bâtiment"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse complète"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ville"
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">Code postal</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="Code postal"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="FR"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    placeholder="Europe/Paris"
                  />
                </div>
              </div>
              
              <Button onClick={handleCreateBuilding} className="w-full">
                Créer le bâtiment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un bâtiment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuildings.map((building) => (
          <Card key={building.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{building.name}</CardTitle>
                </div>
                <Badge variant={building.is_active ? "default" : "secondary"}>
                  {building.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {building.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{building.address}</p>
                    {building.city && building.zip_code && (
                      <p className="text-muted-foreground">
                        {building.zip_code} {building.city}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Créé le {new Date(building.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <div className="flex flex-col space-y-2 pt-2">
                <Button 
                  onClick={() => handleSelectBuilding(building)}
                  className="w-full"
                >
                  Sélectionner ce bâtiment
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(building)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    variant={building.is_active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleBuildingStatus(building.id, building.is_active)}
                    className="flex-1"
                  >
                    {building.is_active ? "Désactiver" : "Activer"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {buildings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Aucun bâtiment créé</p>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier bâtiment pour organiser vos lieux
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer mon premier bâtiment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Building Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le bâtiment</DialogTitle>
            <DialogDescription>
              {selectedBuilding?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom du bâtiment*</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du bâtiment"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-address">Adresse</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-city">Ville</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ville"
                />
              </div>
              <div>
                <Label htmlFor="edit-zip">Code postal</Label>
                <Input
                  id="edit-zip"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="Code postal"
                />
              </div>
            </div>
            
            <Button onClick={handleEditBuilding} className="w-full">
              Mettre à jour
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};