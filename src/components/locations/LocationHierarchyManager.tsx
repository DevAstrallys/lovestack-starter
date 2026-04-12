/**
 * /src/components/locations/LocationHierarchyManager.tsx
 *
 * Generic CRUD manager for location hierarchy levels (ensemble, group).
 * Factorises the identical logic from LocationEnsembles and LocationGroups.
 */
import React, { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LocationTag } from './LocationsManagement';
import { TagSelector } from './TagSelector';
import { createLogger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

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
import { Plus, Edit, Trash2, Search, LayoutGrid, TableIcon } from 'lucide-react';

const log = createLogger('component:location-hierarchy');

// ── Generic item shape ──────────────────────────────────────────────

interface HierarchyItem {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  tags?: DisplayTag[];
  /** Children array — groups for ensembles, elements for groups */
  children?: { id: string; name: string }[];
}

// ── Child item (for the checkbox list in the dialog) ────────────────

interface ChildItem {
  id: string;
  name: string;
}

// ── Props ───────────────────────────────────────────────────────────

export interface LocationHierarchyManagerProps {
  organizationId: string;
  level: 'ensemble' | 'group';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Fetch the items with their relations (children + tags) */
  fetchItems: (orgId: string) => Promise<HierarchyItem[]>;
  /** Fetch available children to assign */
  fetchChildren: (orgId: string) => Promise<ChildItem[]>;
  /** Fetch available tags */
  fetchTags: (orgId: string) => Promise<DisplayTag[]>;
  /** Save (create or update) — returns created id or void */
  saveItem: (params: {
    id?: string;
    name: string;
    description: string | null;
    organization_id: string;
    selectedChildren: string[];
    selectedTags: string[];
  }) => Promise<unknown>;
  /** Delete an item */
  deleteItem: (id: string) => Promise<void>;
  /** Create a new tag */
  createTag: (params: { name: string; color: string; organization_id: string }) => Promise<DisplayTag>;
  /** Label for children column (e.g. "groupements", "éléments") */
  childLabel: string;
  /** Singular label for the item type (e.g. "ensemble", "groupement") */
  itemLabel: string;
}

export const LocationHierarchyManager: React.FC<LocationHierarchyManagerProps> = ({
  organizationId,
  title,
  subtitle,
  icon: Icon,
  fetchItems,
  fetchChildren,
  fetchTags,
  saveItem,
  deleteItem,
  createTag,
  childLabel,
  itemLabel,
}) => {
  const [items, setItems] = useState<HierarchyItem[]>([]);
  const [availableChildren, setAvailableChildren] = useState<ChildItem[]>([]);
  const [availableTags, setAvailableTags] = useState<DisplayTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HierarchyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedChildren: [] as string[],
    selectedTags: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      loadItems();
      loadChildren();
      loadTags();
    }
  }, [organizationId]);

  const loadItems = async () => {
    try {
      const result = await fetchItems(organizationId);
      setItems(result);
    } catch (error) {
      log.error(`Error fetching ${itemLabel}s`, { error });
      toast({ title: 'Erreur', description: `Impossible de charger les ${itemLabel}s`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    try {
      const data = await fetchChildren(organizationId);
      setAvailableChildren(data);
    } catch (error) {
      log.error(`Error fetching ${childLabel}`, { error });
    }
  };

  const loadTags = async () => {
    try {
      const data = await fetchTags(organizationId);
      setAvailableTags(data);
    } catch (error) {
      log.error('Error fetching tags', { error });
    }
  };

  const handleSave = async () => {
    try {
      await saveItem({
        id: editingItem?.id,
        name: formData.name,
        description: formData.description || null,
        organization_id: organizationId,
        selectedChildren: formData.selectedChildren,
        selectedTags: formData.selectedTags,
      });
      toast({ title: 'Succès', description: editingItem ? `${capitalize(itemLabel)} modifié` : `${capitalize(itemLabel)} créé` });
      setDialogOpen(false);
      resetForm();
      loadItems();
    } catch (error) {
      log.error(`Error saving ${itemLabel}`, { error });
      toast({ title: 'Erreur', description: `Impossible de sauvegarder l'${itemLabel}`, variant: 'destructive' });
    }
  };

  const handleEdit = (item: HierarchyItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      selectedChildren: item.children?.map((c) => c.id) || [],
      selectedTags: item.tags?.map((t) => t.id) || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet ${itemLabel} ?`)) return;
    try {
      await deleteItem(itemId);
      toast({ title: 'Succès', description: `${capitalize(itemLabel)} supprimé` });
      loadItems();
    } catch (error) {
      log.error(`Error deleting ${itemLabel}`, { error });
      toast({ title: 'Erreur', description: `Impossible de supprimer l'${itemLabel}`, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', selectedChildren: [], selectedTags: [] });
    setEditingItem(null);
  };

  const toggleChild = (childId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedChildren: prev.selectedChildren.includes(childId)
        ? prev.selectedChildren.filter((id) => id !== childId)
        : [...prev.selectedChildren, childId],
    }));
  };

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter((id) => id !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  };

  const handleCreateTag = async (name: string, color: string) => {
    try {
      const newTag = await createTag({ name, color, organization_id: organizationId });
      setAvailableTags((prev) => [...prev, newTag]);
      toast({ title: 'Succès', description: 'Tag créé avec succès' });
    } catch (error) {
      log.error('Error creating tag', { error });
      toast({ title: 'Erreur', description: 'Impossible de créer le tag', variant: 'destructive' });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag =
      selectedTagFilter === '' || selectedTagFilter === 'all' || item.tags?.some((tag) => tag.id === selectedTagFilter);
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return <div className="text-center py-4">Chargement des {itemLabel}s...</div>;
  }

  const capitalizedChildLabel = capitalize(childLabel);

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
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
                {editingItem ? `Modifier l'${itemLabel}` : `Créer un ${itemLabel}`}
              </DialogTitle>
              <DialogDescription>
                Définissez les propriétés et sélectionnez les {childLabel}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={`Nom de l'${itemLabel}`}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description optionnelle"
                />
              </div>
              <div>
                <Label>{capitalizedChildLabel} inclus</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                  {availableChildren.map((child) => (
                    <div key={child.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`child-${child.id}`}
                        checked={formData.selectedChildren.includes(child.id)}
                        onCheckedChange={() => toggleChild(child.id)}
                      />
                      <Label htmlFor={`child-${child.id}`} className="text-sm">
                        {child.name}
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
                  {editingItem ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Rechercher un ${itemLabel}...`}
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
            {availableTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
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

      {/* ── Table view ──────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>{capitalizedChildLabel}</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Icon className="h-3 w-3 mr-1" />
                      {item.children?.length || 0} {childLabel}
                    </div>
                    {item.children && item.children.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.children.slice(0, 2).map((child) => (
                          <Badge key={child.id} variant="outline" className="text-xs">
                            {child.name}
                          </Badge>
                        ))}
                        {item.children.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.children.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.tags && item.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {item.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
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
        /* ── Cards view ─────────────────────────────────────── */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.description && (
                  <CardDescription className="text-xs">{item.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {item.children && item.children.length > 0 && (
                    <div>
                      <div className="flex items-center text-xs text-muted-foreground mb-1">
                        <Icon className="h-3 w-3 mr-1" />
                        {item.children.length} {childLabel}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.children.slice(0, 3).map((child) => (
                          <Badge key={child.id} variant="outline" className="text-xs">
                            {child.name}
                          </Badge>
                        ))}
                        {item.children.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.children.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Créé le {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Empty states ────────────────────────────────────── */}
      {filteredItems.length === 0 && items.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun {itemLabel} ne correspond aux critères de recherche.</p>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun {itemLabel} créé pour cette organisation.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur &quot;Nouveau&quot; pour créer votre premier {itemLabel}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
