import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LocationTag } from './LocationsManagement';

interface TagsManagementProps {
  organizationId: string;
}

const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
];

export const TagsManagement: React.FC<TagsManagementProps> = ({ organizationId }) => {
  const [tags, setTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<LocationTag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      fetchTags();
    }
  }, [organizationId]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('location_tags' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setTags((data as any) || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const tagData = {
        name: formData.name,
        color: formData.color,
        organization_id: organizationId
      };

      if (editingTag) {
        const { error } = await supabase
          .from('location_tags' as any)
          .update(tagData)
          .eq('id', editingTag.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('location_tags' as any)
          .insert(tagData);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: editingTag ? "Tag modifié" : "Tag créé",
      });

      setDialogOpen(false);
      resetForm();
      fetchTags();
    } catch (error) {
      console.error('Error saving tag:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le tag",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (tag: LocationTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color
    });
    setDialogOpen(true);
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) return;

    try {
      const { error } = await supabase
        .from('location_tags' as any)
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Tag supprimé",
      });

      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le tag",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3b82f6'
    });
    setEditingTag(null);
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des tags...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestion des Tags</h3>
          <p className="text-sm text-muted-foreground">
            Créez et gérez les tags pour catégoriser vos lieux
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Modifier le tag' : 'Créer un tag'}
              </DialogTitle>
              <DialogDescription>
                Définissez le nom et la couleur du tag
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du tag"
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border-2 border-border"
                      style={{ backgroundColor: formData.color }}
                    />
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-8 p-1 cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {PREDEFINED_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={!formData.name.trim()}>
                  {editingTag ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tags.map((tag) => (
          <Card key={tag.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: tag.color }}
                  />
                  <CardTitle className="text-sm">{tag.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  color: tag.color,
                  borderColor: tag.color,
                  backgroundColor: `${tag.color}10`
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun tag créé pour cette organisation.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouveau Tag" pour créer votre premier tag.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};