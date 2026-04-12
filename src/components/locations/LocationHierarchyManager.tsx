/**
 * /src/components/locations/LocationHierarchyManager.tsx
 *
 * Generic CRUD manager for location hierarchy levels (ensemble, group).
 * Sub-components extracted into ./hierarchy/ for maintainability.
 */
import React, { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { LocationTag } from '@/types';
import { createLogger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

import { HierarchyFormDialog } from './hierarchy/HierarchyFormDialog';
import { HierarchyTable } from './hierarchy/HierarchyTable';
import { HierarchyCards } from './hierarchy/HierarchyCards';
import { HierarchyToolbar } from './hierarchy/HierarchyToolbar';
import { HierarchyEmptyStates } from './hierarchy/HierarchyEmptyStates';
import type { HierarchyItem, ChildItem, HierarchyFormData } from './hierarchy/types';

const log = createLogger('component:location-hierarchy');

export type { HierarchyItem, ChildItem };

export interface LocationHierarchyManagerProps {
  organizationId: string;
  level: 'ensemble' | 'group';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  fetchItems: (orgId: string) => Promise<HierarchyItem[]>;
  fetchChildren: (orgId: string) => Promise<ChildItem[]>;
  fetchTags: (orgId: string) => Promise<LocationTag[]>;
  saveItem: (params: {
    id?: string;
    name: string;
    description: string | null;
    organization_id: string;
    selectedChildren: string[];
    selectedTags: string[];
  }) => Promise<unknown>;
  deleteItem: (id: string) => Promise<void>;
  createTag: (params: { name: string; color: string; organization_id: string }) => Promise<LocationTag>;
  childLabel: string;
  itemLabel: string;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const LocationHierarchyManager: React.FC<LocationHierarchyManagerProps> = ({
  organizationId, title, subtitle, icon, fetchItems, fetchChildren,
  fetchTags, saveItem, deleteItem, createTag, childLabel, itemLabel,
}) => {
  const [items, setItems] = useState<HierarchyItem[]>([]);
  const [availableChildren, setAvailableChildren] = useState<ChildItem[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HierarchyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [formData, setFormData] = useState<HierarchyFormData>({
    name: '', description: '', selectedChildren: [], selectedTags: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) { loadItems(); loadChildren(); loadTags(); }
  }, [organizationId]);

  const loadItems = async () => {
    try {
      setItems(await fetchItems(organizationId));
    } catch (error) {
      log.error(`Error fetching ${itemLabel}s`, { error });
      toast({ title: 'Erreur', description: `Impossible de charger les ${itemLabel}s`, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadChildren = async () => {
    try { setAvailableChildren(await fetchChildren(organizationId)); }
    catch (error) { log.error(`Error fetching ${childLabel}`, { error }); }
  };

  const loadTags = async () => {
    try { setAvailableTags(await fetchTags(organizationId)); }
    catch (error) { log.error('Error fetching tags', { error }); }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', selectedChildren: [], selectedTags: [] });
    setEditingItem(null);
  };

  const handleSave = async () => {
    try {
      await saveItem({
        id: editingItem?.id, name: formData.name,
        description: formData.description || null, organization_id: organizationId,
        selectedChildren: formData.selectedChildren, selectedTags: formData.selectedTags,
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
      name: item.name, description: item.description || '',
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
    const matchesSearch = !searchTerm
      || item.name.toLowerCase().includes(searchTerm.toLowerCase())
      || item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      || item.tags?.some((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTagFilter === '' || selectedTagFilter === 'all'
      || item.tags?.some((tag) => tag.id === selectedTagFilter);
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return <div className="text-center py-4">Chargement des {itemLabel}s...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <HierarchyFormDialog
          dialogOpen={dialogOpen} onOpenChange={setDialogOpen}
          editingItem={editingItem} formData={formData} onFormChange={setFormData}
          availableChildren={availableChildren} availableTags={availableTags}
          childLabel={childLabel} itemLabel={itemLabel}
          onSave={handleSave} onCancel={() => setDialogOpen(false)}
          onResetAndOpen={resetForm} onToggleChild={toggleChild}
          onToggleTag={toggleTag} onCreateTag={handleCreateTag}
        />
      </div>

      <HierarchyToolbar
        searchTerm={searchTerm} onSearchChange={setSearchTerm}
        selectedTagFilter={selectedTagFilter} onTagFilterChange={setSelectedTagFilter}
        availableTags={availableTags} viewMode={viewMode}
        onViewModeChange={setViewMode} itemLabel={itemLabel}
      />

      {viewMode === 'table' ? (
        <HierarchyTable items={filteredItems} childLabel={childLabel} icon={icon} onEdit={handleEdit} onDelete={handleDelete} />
      ) : (
        <HierarchyCards items={filteredItems} childLabel={childLabel} icon={icon} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <HierarchyEmptyStates filteredCount={filteredItems.length} totalCount={items.length} itemLabel={itemLabel} />
    </div>
  );
};
