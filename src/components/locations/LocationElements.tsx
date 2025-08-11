import React, { useState, useEffect } from 'react';
import { LocationTag, LocationElement } from './LocationsManagement';
import { TagSelector } from './TagSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, QrCode } from 'lucide-react';

interface LocationElementsProps {
  organizationId: string;
}

export const LocationElements: React.FC<LocationElementsProps> = ({ organizationId }) => {
  const [elements, setElements] = useState<LocationElement[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<LocationElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'France',
    qrLocation: '',
    selectedTags: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      fetchElements();
      fetchAvailableTags();
    }
  }, [organizationId]);

  const fetchElements = async () => {
    try {
      const { data, error } = await supabase
        .from('location_elements' as any)
        .select(`
          *,
          location_element_tags (
            location_tags (*)
          )
        `)
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;

      const elementsWithTags = (data || []).map((element: any) => ({
        ...element,
        tags: element.location_element_tags?.map((et: any) => et.location_tags) || []
      }));

      setElements(elementsWithTags);
    } catch (error) {
      console.error('Error fetching elements:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les éléments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from('location_tags' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setAvailableTags((data as any) || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSave = async () => {
    try {
      const locationData = {
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        country: formData.country,
        qrLocation: formData.qrLocation
      };

      const elementData = {
        name: formData.name,
        description: formData.description || null,
        location_data: Object.values(locationData).some(v => v.trim()) ? locationData : null,
        organization_id: organizationId
      };

      let elementId: string;

      if (editingElement) {
        const { error } = await supabase
          .from('location_elements' as any)
          .update(elementData)
          .eq('id', editingElement.id);

        if (error) throw error;
        elementId = editingElement.id;
      } else {
        const { data, error } = await supabase
          .from('location_elements' as any)
          .insert(elementData)
          .select()
          .single();

        if (error) throw error;
        elementId = (data as any).id;
      }

      // Update tags
      await supabase
        .from('location_element_tags' as any)
        .delete()
        .eq('element_id', elementId);

      if (formData.selectedTags.length > 0) {
        const tagInserts = formData.selectedTags.map(tagId => ({
          element_id: elementId,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('location_element_tags' as any)
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      toast({
        title: "Succès",
        description: editingElement ? "Élément modifié" : "Élément créé",
      });

      setDialogOpen(false);
      resetForm();
      fetchElements();
    } catch (error) {
      console.error('Error saving element:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'élément",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (element: LocationElement) => {
    setEditingElement(element);
    const locationData = element.location_data as any;
    setFormData({
      name: element.name,
      description: element.description || '',
      address: locationData?.address || '',
      city: locationData?.city || '',
      zipCode: locationData?.zipCode || '',
      country: locationData?.country || 'France',
      qrLocation: locationData?.qrLocation || '',
      selectedTags: element.tags?.map(tag => tag.id) || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (elementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      const { error } = await supabase
        .from('location_elements' as any)
        .delete()
        .eq('id', elementId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Élément supprimé",
      });

      fetchElements();
    } catch (error) {
      console.error('Error deleting element:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élément",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      zipCode: '',
      country: 'France',
      qrLocation: '',
      selectedTags: []
    });
    setEditingElement(null);
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const handleCreateTag = async (name: string, color: string) => {
    try {
      const { data, error } = await supabase
        .from('location_tags' as any)
        .insert({
          name,
          color,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw error;

      const newTag: LocationTag = {
        id: (data as any).id,
        name: (data as any).name,
        color: (data as any).color,
        organization_id: (data as any).organization_id,
        created_at: (data as any).created_at
      };

      setAvailableTags(prev => [...prev, newTag]);
      
      toast({
        title: "Succès",
        description: "Tag créé avec succès",
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le tag",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQRCode = async (elementId: string, elementName: string) => {
    try {
      const element = elements.find(e => e.id === elementId);
      const locationData = element?.location_data as any;
      
      const qrData = {
        location_element_id: elementId,
        display_label: `QR Code - ${elementName}`,
        target_slug: `element/${elementId}`,
        location: {
          description: locationData?.qrLocation || 'Localisation non spécifiée'
        },
        is_active: true
      };

      const { data, error } = await supabase
        .from('qr_codes' as any)
        .insert(qrData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: `QR Code généré pour ${elementName}`,
      });

      // Optionnel: ouvrir une nouvelle fenêtre avec le QR code
      const qrUrl = `${window.location.origin}/qr/${(data as any).id}`;
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`, '_blank');
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le QR code",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des éléments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Éléments de Lieu</h3>
          <p className="text-sm text-muted-foreground">
            Les éléments sont les unités de base de votre hiérarchie de lieux
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingElement ? 'Modifier l\'élément' : 'Créer un élément'}
              </DialogTitle>
              <DialogDescription>
                Définissez les propriétés de l'élément de lieu
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de l'élément"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description optionnelle"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 rue de la République"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Code postal</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="75001"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="France"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="qrLocation">Localisation du QR Code</Label>
                <Input
                  id="qrLocation"
                  value={formData.qrLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, qrLocation: e.target.value }))}
                  placeholder="Entrée principale, Étage 2, Salle A..."
                />
              </div>
              <TagSelector
                availableTags={availableTags}
                selectedTags={formData.selectedTags}
                onTagToggle={toggleTag}
                onTagCreate={handleCreateTag}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={!formData.name.trim()}>
                  {editingElement ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {elements.map((element) => (
          <Card key={element.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{element.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(element)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateQRCode(element.id, element.name)}
                    title="Générer QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(element.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {element.description && (
                <CardDescription className="text-xs">
                  {element.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  const locationData = element.location_data as any;
                  const hasAddress = locationData?.address || locationData?.city || locationData?.zipCode;
                  
                  return hasAddress && (
                    <div className="text-xs text-muted-foreground">
                      {locationData?.address && (
                        <div>{locationData.address}</div>
                      )}
                      {(locationData?.zipCode || locationData?.city) && (
                        <div>
                          {locationData?.zipCode && `${locationData.zipCode} `}
                          {locationData?.city}
                          {locationData?.country && locationData.country !== 'France' && `, ${locationData.country}`}
                        </div>
                      )}
                      {locationData?.qrLocation && (
                        <div className="mt-1 text-primary">
                          📍 QR: {locationData.qrLocation}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {element.tags && element.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {element.tags.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Créé le {new Date(element.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {elements.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun élément créé pour cette organisation.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouveau" pour créer votre premier élément.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};