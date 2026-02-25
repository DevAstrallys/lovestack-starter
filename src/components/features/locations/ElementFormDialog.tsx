import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TagSelector } from '@/components/locations/TagSelector';
import { LocationTag, LocationElement, ElementFormData } from './types';

interface ElementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ElementFormData;
  onFormChange: (data: ElementFormData) => void;
  onSave: () => void;
  editingElement: LocationElement | null;
  availableTags: LocationTag[];
  onTagCreate: (name: string, color: string) => Promise<void>;
}

export const ElementFormDialog: React.FC<ElementFormDialogProps> = ({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSave,
  editingElement,
  availableTags,
  onTagCreate,
}) => {
  const updateField = (field: keyof ElementFormData, value: string) => {
    onFormChange({ ...formData, [field]: value });
  };

  const toggleTag = (tagId: string) => {
    const selectedTags = formData.selectedTags.includes(tagId)
      ? formData.selectedTags.filter((id) => id !== tagId)
      : [...formData.selectedTags, tagId];
    onFormChange({ ...formData, selectedTags });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingElement ? "Modifier l'élément" : 'Créer un élément'}</DialogTitle>
          <DialogDescription>Définissez les propriétés de l'élément de lieu</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Nom de l'élément" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Description optionnelle" rows={3} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="123 rue de la République" />
            </div>
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input id="city" value={formData.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Paris" />
            </div>
            <div>
              <Label htmlFor="zipCode">Code postal</Label>
              <Input id="zipCode" value={formData.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} placeholder="75001" />
            </div>
            <div>
              <Label htmlFor="country">Pays</Label>
              <Input id="country" value={formData.country} onChange={(e) => updateField('country', e.target.value)} placeholder="France" />
            </div>
          </div>
          <div>
            <Label htmlFor="qrLocation">Localisation du QR Code</Label>
            <Input id="qrLocation" value={formData.qrLocation} onChange={(e) => updateField('qrLocation', e.target.value)} placeholder="Entrée principale, Étage 2, Salle A..." />
          </div>
          <TagSelector availableTags={availableTags} selectedTags={formData.selectedTags} onTagToggle={toggleTag} onTagCreate={onTagCreate} />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={onSave} disabled={!formData.name.trim()}>{editingElement ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
