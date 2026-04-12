import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { TagSelector } from '@/components/locations/TagSelector';
import type { LocationTag } from '@/types';
import type { HierarchyItem, ChildItem, HierarchyFormData } from './types';

interface HierarchyFormDialogProps {
  dialogOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: HierarchyItem | null;
  formData: HierarchyFormData;
  onFormChange: (updater: (prev: HierarchyFormData) => HierarchyFormData) => void;
  availableChildren: ChildItem[];
  availableTags: LocationTag[];
  childLabel: string;
  itemLabel: string;
  onSave: () => void;
  onCancel: () => void;
  onResetAndOpen: () => void;
  onToggleChild: (childId: string) => void;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => Promise<void>;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const HierarchyFormDialog: React.FC<HierarchyFormDialogProps> = ({
  dialogOpen, onOpenChange, editingItem, formData, onFormChange,
  availableChildren, availableTags, childLabel, itemLabel,
  onSave, onCancel, onResetAndOpen, onToggleChild, onToggleTag, onCreateTag,
}) => {
  const capitalizedChildLabel = capitalize(childLabel);

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onResetAndOpen} className="shrink-0">
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
              onChange={(e) => onFormChange((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={`Nom de l'${itemLabel}`}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormChange((prev) => ({ ...prev, description: e.target.value }))}
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
                    onCheckedChange={() => onToggleChild(child.id)}
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
            onTagToggle={onToggleTag}
            onTagCreate={onCreateTag}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button onClick={onSave} disabled={!formData.name.trim()}>
              {editingItem ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
