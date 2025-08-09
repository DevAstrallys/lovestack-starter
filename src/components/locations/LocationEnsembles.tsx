import React, { useState, useEffect } from 'react';
import { LocationTag, LocationGroup, LocationEnsemble } from './LocationsManagement';
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
import { Plus, Edit, Trash2, Building } from 'lucide-react';

interface LocationEnsemblesProps {
  buildingId: string;
}

export const LocationEnsembles: React.FC<LocationEnsemblesProps> = ({ buildingId }) => {
  const [ensembles, setEnsembles] = useState<LocationEnsemble[]>([]);
  const [availableGroups, setAvailableGroups] = useState<LocationGroup[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnsemble, setEditingEnsemble] = useState<LocationEnsemble | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedGroups: [] as string[],
    selectedTags: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (buildingId) {
      fetchEnsembles();
      fetchAvailableGroups();
      fetchAvailableTags();
    }
  }, [buildingId]);

  const fetchEnsembles = async () => {
    try {
      const { data, error } = await supabase
        .from('location_ensembles' as any)
        .select(`
          *,
          location_ensemble_groups (
            location_groups (*)
          ),
          location_ensemble_tags (
            location_tags (*)
          )
        `)
        .eq('building_id', buildingId)
        .order('name');

      if (error) throw error;

      const ensemblesWithRelations = (data || []).map((ensemble: any) => ({
        ...ensemble,
        groups: ensemble.location_ensemble_groups?.map((eg: any) => eg.location_groups) || [],
        tags: ensemble.location_ensemble_tags?.map((et: any) => et.location_tags) || []
      }));

      setEnsembles(ensemblesWithRelations);
    } catch (error) {
      console.error('Error fetching ensembles:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ensembles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('location_groups' as any)
        .select('*')
        .eq('building_id', buildingId)
        .order('name');

      if (error) throw error;
      setAvailableGroups((data as any) || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
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
      const ensembleData = {
        name: formData.name,
        description: formData.description || null,
        building_id: buildingId
      };

      let ensembleId: string;

      if (editingEnsemble) {
        const { error } = await supabase
          .from('location_ensembles' as any)
          .update(ensembleData)
          .eq('id', editingEnsemble.id);

        if (error) throw error;
        ensembleId = editingEnsemble.id;
      } else {
        const { data, error } = await supabase
          .from('location_ensembles' as any)
          .insert(ensembleData)
          .select()
          .single();

        if (error) throw error;
        ensembleId = (data as any).id;
      }

      // Update groups
      await supabase
        .from('location_ensemble_groups' as any)
        .delete()
        .eq('ensemble_id', ensembleId);

      if (formData.selectedGroups.length > 0) {
        const groupInserts = formData.selectedGroups.map(groupId => ({
          ensemble_id: ensembleId,
          group_id: groupId
        }));

        const { error: groupError } = await supabase
          .from('location_ensemble_groups' as any)
          .insert(groupInserts);

        if (groupError) throw groupError;
      }

      // Update tags
      await supabase
        .from('location_ensemble_tags' as any)
        .delete()
        .eq('ensemble_id', ensembleId);

      if (formData.selectedTags.length > 0) {
        const tagInserts = formData.selectedTags.map(tagId => ({
          ensemble_id: ensembleId,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('location_ensemble_tags' as any)
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      toast({
        title: "Succès",
        description: editingEnsemble ? "Ensemble modifié" : "Ensemble créé",
      });

      setDialogOpen(false);
      resetForm();
      fetchEnsembles();
    } catch (error) {
      console.error('Error saving ensemble:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'ensemble",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ensemble: LocationEnsemble) => {
    setEditingEnsemble(ensemble);
    setFormData({
      name: ensemble.name,
      description: ensemble.description || '',
      selectedGroups: ensemble.groups?.map(group => group.id) || [],
      selectedTags: ensemble.tags?.map(tag => tag.id) || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (ensembleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ensemble ?')) return;

    try {
      const { error } = await supabase
        .from('location_ensembles' as any)
        .delete()
        .eq('id', ensembleId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Ensemble supprimé",
      });

      fetchEnsembles();
    } catch (error) {
      console.error('Error deleting ensemble:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'ensemble",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      selectedGroups: [],
      selectedTags: []
    });
    setEditingEnsemble(null);
  };

  const toggleGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
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
        .from('location_tags')
        .insert({
          name,
          color,
          building_id: buildingId
        })
        .select()
        .single();

      if (error) throw error;

      const newTag: LocationTag = {
        id: data.id,
        name: data.name,
        color: data.color,
        building_id: data.building_id,
        created_at: data.created_at
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
    return <div className="text-center py-4">Chargement des ensembles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Ensembles de Lieux</h3>
          <p className="text-sm text-muted-foreground">
            Les ensembles permettent de rassembler plusieurs groupements pour une vision macro
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
                {editingEnsemble ? 'Modifier l\'ensemble' : 'Créer un ensemble'}
              </DialogTitle>
              <DialogDescription>
                Définissez les propriétés de l'ensemble et sélectionnez les groupements
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de l'ensemble"
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
                <Label>Groupements inclus</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                  {availableGroups.map(group => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={formData.selectedGroups.includes(group.id)}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      <Label htmlFor={`group-${group.id}`} className="text-sm">
                        {group.name}
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
                  {editingEnsemble ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ensembles.map((ensemble) => (
          <Card key={ensemble.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{ensemble.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(ensemble)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ensemble.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {ensemble.description && (
                <CardDescription className="text-xs">
                  {ensemble.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ensemble.groups && ensemble.groups.length > 0 && (
                  <div>
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <Building className="h-3 w-3 mr-1" />
                      {ensemble.groups.length} groupement(s)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ensemble.groups.slice(0, 3).map(group => (
                        <Badge key={group.id} variant="outline" className="text-xs">
                          {group.name}
                        </Badge>
                      ))}
                      {ensemble.groups.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{ensemble.groups.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {ensemble.tags && ensemble.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ensemble.tags.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Créé le {new Date(ensemble.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ensembles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun ensemble créé pour ce bâtiment.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouveau" pour créer votre premier ensemble.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};