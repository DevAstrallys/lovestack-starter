import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, LayoutGrid, TableIcon } from 'lucide-react';
import type { LocationTag } from '@/types';

interface HierarchyToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTagFilter: string;
  onTagFilterChange: (value: string) => void;
  availableTags: LocationTag[];
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  itemLabel: string;
}

export const HierarchyToolbar: React.FC<HierarchyToolbarProps> = ({
  searchTerm, onSearchChange, selectedTagFilter, onTagFilterChange,
  availableTags, viewMode, onViewModeChange, itemLabel,
}) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-4">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder={`Rechercher un ${itemLabel}...`}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
    <Select value={selectedTagFilter} onValueChange={onTagFilterChange}>
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
        onClick={() => onViewModeChange('table')}
        className="rounded-r-none"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('cards')}
        className="rounded-l-none"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
