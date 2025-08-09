import React, { useState, useEffect } from 'react';
import { LocationTag, LocationElement, LocationGroup } from './LocationsManagement';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, MapPin, Building } from 'lucide-react';

interface LocationGroupsProps {
  buildingId: string;
}

export const LocationGroups: React.FC<LocationGroupsProps> = ({ buildingId }) => {
  const [groups, setGroups] = useState<LocationGroup[]>([]);
  const [availableElements, setAvailableElements] = useState<LocationElement[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LocationGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedElements: [] as string[],
    selectedTags: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (buildingId) {
      fetchGroups();
      fetchAvailableElements();
      fetchAvailableTags();
    }
  }, [buildingId]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('location_groups' as any)
        .select(`
          *,
          location_group_elements (
            location_elements (*)
          ),
          location_group_tags (
            location_tags (*)
          )
        `)
        .eq('building_id', buildingId)
        .order('name');

      if (error) throw error;

      const groupsWithRelations = (data || []).map((group: any) => ({
        ...group,
        elements: group.location_group_elements?.map((ge: any) => ge.location_elements) || [],
        tags: group.location_group_tags?.map((gt: any) => gt.location_tags) || []
      }));

      setGroups(groupsWithRelations);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les groupements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableElements = async () => {
    try {
      const { data, error } = await supabase
        .from('location_elements' as any)
        .select('*')
        .eq('building_id', buildingId)
        .order('name');

      if (error) throw error;
      setAvailableElements((data as any) || []);
    } catch (error) {
      console.error('Error fetching elements:', error);
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
      const groupData = {
        name: formData.name,
        description: formData.description || null,
        building_id: buildingId
      };

      let groupId: string;

      if (editingGroup) {
        const { error } = await supabase
          .from('location_groups' as any)
          .update(groupData)
          .eq('id', editingGroup.id);

        if (error) throw error;
        groupId = editingGroup.id;
      } else {
        const { data, error } = await supabase
          .from('location_groups' as any)
          .insert(groupData)
          .select()
          .single();

        if (error) throw error;
        groupId = (data as any).id;
      }

      // Update elements
      await supabase
        .from('location_group_elements' as any)
        .delete()
        .eq('group_id', groupId);

      if (formData.selectedElements.length > 0) {
        const elementInserts = formData.selectedElements.map(elementId => ({
          group_id: groupId,
          element_id: elementId
        }));

        const { error: elementError } = await supabase
          .from('location_group_elements' as any)
          .insert(elementInserts);

        if (elementError) throw elementError;
      }

      // Update tags
      await supabase
        .from('location_group_tags' as any)
        .delete()
        .eq('group_id', groupId);

      if (formData.selectedTags.length > 0) {
        const tagInserts = formData.selectedTags.map(tagId => ({
          group_id: groupId,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('location_group_tags' as any)
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      toast({
        title: "Succès",
        description: editingGroup ? "Groupement modifié" : "Groupement créé",
      });

      setDialogOpen(false);
      resetForm();
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le groupement",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (group: LocationGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      selectedElements: group.elements?.map(element => element.id) || [],
      selectedTags: group.tags?.map(tag => tag.id) || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupement ?')) return;

    try {
      const { error } = await supabase
        .from('location_groups' as any)
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Groupement supprimé",
      });

      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le groupement",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      selectedElements: [],
      selectedTags: []
    });
    setEditingGroup(null);
  };

  const toggleElement = (elementId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedElements: prev.selectedElements.includes(elementId)
        ? prev.selectedElements.filter(id => id !== elementId)
        : [...prev.selectedElements, elementId]
    }));
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
          building_id: buildingId
        })
        .select()
        .single();

      if (error) throw error;

      const newTag: LocationTag = {
        id: (data as any).id,
        name: (data as any).name,
        color: (data as any).color,
        building_id: (data as any).building_id,
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

  if (loading) {
    return <div className="text-center py-4">Chargement des groupements...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Groupements de Lieux</h3>
          <p className="text-sm text-muted-foreground">
            Les groupements permettent de rassembler plusieurs éléments
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Modifier le groupement' : 'Créer un groupement'}
              </DialogTitle>
              <DialogDescription>
                Définissez les propriétés du groupement et sélectionnez les éléments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du groupement"
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
                <Label>Éléments inclus</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                  {availableElements.map(element => (
                    <div key={element.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`element-${element.id}`}
                        checked={formData.selectedElements.includes(element.id)}
                        onCheckedChange={() => toggleElement(element.id)}
                      />
                      <Label htmlFor={`element-${element.id}`} className="text-sm">
                        {element.name}
                      </Label>
                    </div>
                  ))}
                </div>
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
                  {editingGroup ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{group.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(group)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {group.description && (
                <CardDescription className="text-xs">
                  {group.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.elements && group.elements.length > 0 && (
                  <div>
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {group.elements.length} élément(s)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.elements.slice(0, 3).map(element => (
                        <Badge key={element.id} variant="outline" className="text-xs">
                          {element.name}
                        </Badge>
                      ))}
                      {group.elements.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{group.elements.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {group.tags.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Créé le {new Date(group.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun groupement créé pour ce bâtiment.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouveau" pour créer votre premier groupement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};