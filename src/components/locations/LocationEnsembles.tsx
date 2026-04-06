import React, { useState, useEffect } from 'react';
import { LocationTag, LocationGroup, LocationEnsemble } from './LocationsManagement';
import { TagSelector } from './TagSelector';
import { createLogger } from '@/lib/logger';
import {
  fetchEnsemblesWithRelations,
  fetchGroupsByOrganization,
  fetchLocationTags,
  saveEnsemble,
  deleteEnsemble,
  createLocationTag,
} from '@/services/locations';
import { useToast } from '@/hooks/use-toast';

const log = createLogger('component:location-ensembles');
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Building, Search, LayoutGrid, TableIcon } from 'lucide-react';

interface LocationEnsemblesProps {
  organizationId: string;
}

export const LocationEnsembles: React.FC<LocationEnsemblesProps> = ({ organizationId }) => {
  const [ensembles, setEnsembles] = useState<LocationEnsemble[]>([]);
  const [availableGroups, setAvailableGroups] = useState<LocationGroup[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnsemble, setEditingEnsemble] = useState<LocationEnsemble | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedGroups: [] as string[],
    selectedTags: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      fetchEnsembles();
      fetchAvailableGroups();
      fetchAvailableTags();
    }
  }, [organizationId]);

  const fetchEnsembles = async () => {
    try {
      const result = await fetchEnsemblesWithRelations(organizationId);
      setEnsembles(result);
    } catch (error) {
      log.error('Error fetching ensembles', { error });
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
      const data = await fetchGroupsByOrganization(organizationId);
      setAvailableGroups(data as any);
    } catch (error) {
      log.error('Error fetching groups', { error });
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const data = await fetchLocationTags(organizationId);
      setAvailableTags(data as any);
    } catch (error) {
      log.error('Error fetching tags', { error });
    }
  };

  const handleSave = async () => {
    try {
      await saveEnsemble({
        id: editingEnsemble?.id,
        name: formData.name,
        description: formData.description || null,
        organization_id: organizationId,
        selectedGroups: formData.selectedGroups,
        selectedTags: formData.selectedTags,
      });

      toast({
        title: "Succès",
        description: editingEnsemble ? "Ensemble modifié" : "Ensemble créé",
      });

      setDialogOpen(false);
      resetForm();
      fetchEnsembles();
    } catch (error) {
      log.error('Error saving ensemble', { error });
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
      await deleteEnsemble(ensembleId);

      toast({
        title: "Succès",
        description: "Ensemble supprimé",
      });

      fetchEnsembles();
    } catch (error) {
      log.error('Error deleting ensemble', { error });
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
      const data = await createLocationTag({ name, color, organization_id: organizationId });

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
      log.error('Error creating tag', { error });
      toast({
        title: "Erreur",
        description: "Impossible de créer le tag",
        variant: "destructive",
      });
    }
  };

  const filteredEnsembles = ensembles.filter(ensemble => {
    const matchesSearch = !searchTerm || 
      ensemble.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ensemble.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ensemble.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = selectedTagFilter === '' || selectedTagFilter === 'all' || 
      ensemble.tags?.some(tag => tag.id === selectedTagFilter);
    
    return matchesSearch && matchesTag;
  });

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

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un ensemble..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTagFilter} onValueChange={setSelectedTagFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer par tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les tags</SelectItem>
            {availableTags.map(tag => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="rounded-r-none"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="rounded-l-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Groupements</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnsembles.map((ensemble) => (
                <TableRow key={ensemble.id}>
                  <TableCell className="font-medium">{ensemble.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{ensemble.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building className="h-3 w-3 mr-1" />
                      {ensemble.groups?.length || 0} groupement(s)
                    </div>
                    {ensemble.groups && ensemble.groups.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ensemble.groups.slice(0, 2).map(group => (
                          <Badge key={group.id} variant="outline" className="text-xs">
                            {group.name}
                          </Badge>
                        ))}
                        {ensemble.groups.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{ensemble.groups.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {ensemble.tags && ensemble.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ensemble.tags.slice(0, 2).map(tag => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {ensemble.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{ensemble.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ensemble.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEnsembles.map((ensemble) => (
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
      )}

      {filteredEnsembles.length === 0 && ensembles.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun ensemble ne correspond aux critères de recherche.</p>
          </CardContent>
        </Card>
      )}

      {ensembles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun ensemble créé pour cette organisation.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouveau" pour créer votre premier ensemble.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};