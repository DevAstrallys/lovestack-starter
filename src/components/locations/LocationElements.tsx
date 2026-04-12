import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { LocationElement } from '@/types';
import type { LocationData } from '@/types';
import { ElementFormData, defaultFormData } from '@/components/features/locations/types';
import { useLocationElements } from '@/components/features/locations/useLocationElements';
import { ElementFormDialog } from '@/components/features/locations/ElementFormDialog';
import { ElementsTable } from '@/components/features/locations/ElementsTable';
import { ElementsCardGrid } from '@/components/features/locations/ElementsCardGrid';
import { ElementsToolbar } from '@/components/features/locations/ElementsToolbar';
import { ConfirmCreateAnotherDialog } from '@/components/features/locations/ConfirmCreateAnotherDialog';

interface LocationElementsProps {
  organizationId: string;
}

export const LocationElements: React.FC<LocationElementsProps> = ({ organizationId }) => {
  const { elements, availableTags, loading, saveElement, deleteElement, generateQRCode, createTag } = useLocationElements(organizationId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<LocationElement | null>(null);
  const [formData, setFormData] = useState<ElementFormData>(defaultFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [lastCreatedElement, setLastCreatedElement] = useState<{ name: string; addressData: Partial<ElementFormData> } | null>(null);

  const filteredElements = useMemo(() => {
    return elements.filter((el) => {
      const matchesSearch =
        !searchTerm ||
        el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        el.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        el.tags?.some((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = !selectedTagFilter || selectedTagFilter === 'all' || el.tags?.some((t) => t.id === selectedTagFilter);
      return matchesSearch && matchesTag;
    });
  }, [elements, searchTerm, selectedTagFilter]);

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingElement(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (element: LocationElement) => {
    setEditingElement(element);
    const ld = element.location_data as LocationData | null;
    setFormData({
      name: element.name,
      description: element.description || '',
      address: ld?.address || '',
      city: ld?.city || '',
      zipCode: ld?.zipCode || '',
      country: ld?.country || 'France',
      qrLocation: ld?.qrLocation || '',
      selectedTags: element.tags?.map((t) => t.id) || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await saveElement(formData, editingElement);
      setDialogOpen(false);

      if (!editingElement) {
        setLastCreatedElement({
          name: formData.name,
          addressData: { address: formData.address, city: formData.city, zipCode: formData.zipCode, country: formData.country, qrLocation: formData.qrLocation },
        });
        setConfirmationDialogOpen(true);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving element:', error);
    }
  };

  const handleCreateAnother = () => {
    if (lastCreatedElement) {
      setFormData({ ...defaultFormData, ...lastCreatedElement.addressData });
      setConfirmationDialogOpen(false);
      setDialogOpen(true);
      setLastCreatedElement(null);
    }
  };

  if (loading) return <div className="text-center py-4">Chargement des éléments...</div>;

  return (
    <div className="space-y-4">
      <ElementsToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedTagFilter={selectedTagFilter}
        onTagFilterChange={setSelectedTagFilter}
        availableTags={availableTags}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClick={handleCreateClick}
      />

      {viewMode === 'table' ? (
        <ElementsTable elements={filteredElements} onEdit={handleEdit} onDelete={deleteElement} onGenerateQR={generateQRCode} />
      ) : (
        <ElementsCardGrid elements={filteredElements} onEdit={handleEdit} onDelete={deleteElement} onGenerateQR={generateQRCode} />
      )}

      {elements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun élément créé pour cette organisation.</p>
            <p className="text-sm text-muted-foreground mt-1">Cliquez sur "Nouveau" pour créer votre premier élément.</p>
          </CardContent>
        </Card>
      ) : filteredElements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun élément ne correspond à vos critères de recherche.</p>
          </CardContent>
        </Card>
      ) : null}

      <ElementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSave={handleSave}
        editingElement={editingElement}
        availableTags={availableTags}
        onTagCreate={createTag}
      />

      <ConfirmCreateAnotherDialog
        open={confirmationDialogOpen}
        onOpenChange={setConfirmationDialogOpen}
        elementName={lastCreatedElement?.name || null}
        onCreateAnother={handleCreateAnother}
        onFinish={() => { setConfirmationDialogOpen(false); setLastCreatedElement(null); }}
      />
    </div>
  );
};
