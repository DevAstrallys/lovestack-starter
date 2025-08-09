import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LocationElement, LocationTag } from './LocationsManagement';

interface LocationElementsProps {
  buildingId: string;
}

export const LocationElements: React.FC<LocationElementsProps> = ({ buildingId }) => {
  const [elements, setElements] = useState<LocationElement[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<LocationElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location_data: '',
    selectedTags: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (buildingId) {
      fetchElements();
      fetchAvailableTags();
    }
  }, [buildingId]);

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
        .eq('building_id', buildingId)
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
        .eq('building_id', buildingId)
        .order('name');

      if (error) throw error;
      setAvailableTags((data as any) || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSave = async () => {
    try {
      const elementData = {
        name: formData.name,
        description: formData.description || null,
        location_data: formData.location_data ? JSON.parse(formData.location_data) : null,
        building_id: buildingId
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
    setFormData({
      name: element.name,
      description: element.description || '',
      location_data: element.location_data ? JSON.stringify(element.location_data, null, 2) : '',
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
      location_data: '',
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
              <div>
                <Label htmlFor="location_data">Données de localisation (JSON)</Label>
                <Textarea
                  id="location_data"
                  value={formData.location_data}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_data: e.target.value }))}
                  placeholder='{"address": "123 rue...", "coordinates": [lat, lng]}'
                  rows={3}
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant={formData.selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
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
            <p className="text-muted-foreground">Aucun élément créé pour ce bâtiment.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouveau" pour créer votre premier élément.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};