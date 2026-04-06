import React, { useState, useEffect } from 'react';
import { LocationTag, LocationElement, LocationGroup } from './LocationsManagement';
import { TagSelector } from './TagSelector';
import { createLogger } from '@/lib/logger';
import {
  fetchGroupsWithRelations,
  fetchElementsByOrganization,
  fetchLocationTags,
  saveGroup,
  deleteGroup,
  createLocationTag,
} from '@/services/locations';
import { useToast } from '@/hooks/use-toast';

const log = createLogger('component:location-groups');
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
import { Plus, Edit, Trash2, MapPin, Building, Search, LayoutGrid, TableIcon } from 'lucide-react';

interface LocationGroupsProps {
  organizationId: string;
}

export const LocationGroups: React.FC<LocationGroupsProps> = ({ organizationId }) => {
  const [groups, setGroups] = useState<LocationGroup[]>([]);
  const [availableElements, setAvailableElements] = useState<LocationElement[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LocationGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedElements: [] as string[],
    selectedTags: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      fetchGroups();
      fetchAvailableElements();
      fetchAvailableTags();
    }
  }, [organizationId]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('location_groups' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;

      // Fetch child elements and tags for each group
      const groupIds = (data || []).map((g: any) => g.id);
      
      const [elementsRes, tagsRes] = await Promise.all([
        supabase.from('location_elements' as any).select('*').in('parent_id', groupIds),
        supabase.from('location_group_tags' as any).select('*, location_tags(*)').in('group_id', groupIds)
      ]);

      const elementsByGroup = (elementsRes.data || []).reduce((acc: any, e: any) => {
        (acc[e.parent_id] = acc[e.parent_id] || []).push(e);
        return acc;
      }, {});

      const tagsByGroup = (tagsRes.data || []).reduce((acc: any, gt: any) => {
        (acc[gt.group_id] = acc[gt.group_id] || []).push(gt.location_tags);
        return acc;
      }, {});

      const groupsWithRelations = (data || []).map((group: any) => ({
        ...group,
        elements: elementsByGroup[group.id] || [],
        tags: tagsByGroup[group.id] || []
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
        .eq('organization_id', organizationId)
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
      const groupData = {
        name: formData.name,
        description: formData.description || null,
        organization_id: organizationId
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
          .maybeSingle();

        if (error) throw error;
        groupId = (data as any).id;
      }

      // Update elements: set parent_id on selected elements, clear on deselected
      await supabase
        .from('location_elements' as any)
        .update({ parent_id: null })
        .eq('parent_id', groupId);

      if (formData.selectedElements.length > 0) {
        const { error: elementError } = await supabase
          .from('location_elements' as any)
          .update({ parent_id: groupId })
          .in('id', formData.selectedElements);

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
          organization_id: organizationId
        })
        .select()
        .maybeSingle();

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

  const filteredGroups = groups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = selectedTagFilter === '' || selectedTagFilter === 'all' || 
      group.tags?.some(tag => tag.id === selectedTagFilter);
    
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return <div className="text-center py-4">Chargement des groupements...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">Groupements de Lieux</h3>
          <p className="text-sm text-muted-foreground">
            Les groupements permettent de rassembler plusieurs éléments
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="shrink-0">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nouveau</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
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

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un groupement..."
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
                <TableHead>Éléments</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{group.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {group.elements?.length || 0} élément(s)
                    </div>
                    {group.elements && group.elements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.elements.slice(0, 2).map(element => (
                          <Badge key={element.id} variant="outline" className="text-xs">
                            {element.name}
                          </Badge>
                        ))}
                        {group.elements.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{group.elements.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {group.tags && group.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {group.tags.slice(0, 2).map(tag => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {group.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(group.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
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
      )}

      {filteredGroups.length === 0 && groups.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun groupement ne correspond aux critères de recherche.</p>
          </CardContent>
        </Card>
      )}

      {groups.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun groupement créé pour cette organisation.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouveau" pour créer votre premier groupement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};