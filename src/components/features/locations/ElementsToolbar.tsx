import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { LocationTag } from './types';

interface ElementsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTagFilter: string;
  onTagFilterChange: (value: string) => void;
  availableTags: LocationTag[];
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onCreateClick: () => void;
}

export const ElementsToolbar: React.FC<ElementsToolbarProps> = ({
  searchTerm,
  onSearchChange,
  selectedTagFilter,
  onTagFilterChange,
  availableTags,
  viewMode,
  onViewModeChange,
  onCreateClick,
}) => (
  <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold">Éléments de Lieu</h3>
        <p className="text-sm text-muted-foreground">Les éléments sont les unités de base de votre hiérarchie de lieux</p>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={viewMode} onValueChange={(v: 'cards' | 'table') => onViewModeChange(v)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="table">Tableau</SelectItem>
            <SelectItem value="cards">Cartes</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onCreateClick} className="shrink-0">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nouveau</span>
        </Button>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="Rechercher par nom, description ou tag..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
      </div>
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedTagFilter} onValueChange={onTagFilterChange}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrer par tag" /></SelectTrigger>
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
      </div>
    </div>
  </>
);
