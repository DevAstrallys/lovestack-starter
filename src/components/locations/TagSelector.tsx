import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, Palette } from 'lucide-react';
import { LocationTag } from './LocationsManagement';

const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
];

interface TagSelectorProps {
  availableTags: LocationTag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  onTagCreate: (name: string, color: string) => Promise<void>;
  disabled?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  onTagToggle,
  onTagCreate,
  disabled = false
}) => {
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PREDEFINED_COLORS[0]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      await onTagCreate(newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor(PREDEFINED_COLORS[0]);
      setNewTagDialogOpen(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Tags</Label>
        <Dialog open={newTagDialogOpen} onOpenChange={setNewTagDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <Plus className="h-3 w-3 mr-1" />
              Nouveau tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un nouveau tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tag-name">Nom du tag</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nom du tag"
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {PREDEFINED_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTagColor === color ? 'border-primary' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
                <div className="flex items-center mt-2 space-x-2">
                  <Palette className="h-4 w-4" />
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-16 h-8"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setNewTagDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => (
          <Badge
            key={tag.id}
            variant={selectedTags.includes(tag.id) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => !disabled && onTagToggle(tag.id)}
            style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag.name}
          </Badge>
        ))}
        {availableTags.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun tag disponible. Créez-en un avec le bouton ci-dessus.
          </p>
        )}
      </div>
    </div>
  );
};