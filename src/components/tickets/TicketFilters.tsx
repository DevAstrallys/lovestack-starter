import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import { TicketFilters as ITicketFilters, TicketStatus, TicketPriority } from '@/hooks/useTickets';
import { useLocations } from '@/hooks/useLocations';
import { useTaxonomy } from '@/hooks/useTaxonomy';
import { TICKET_STATUSES, TICKET_PRIORITIES } from '@/utils/ticketUtils';

interface TicketFiltersProps {
  filters: ITicketFilters;
  onFiltersChange: (filters: ITicketFilters) => void;
  onReset: () => void;
}

export function TicketFilters({ filters, onFiltersChange, onReset }: TicketFiltersProps) {
  const { locations } = useLocations();
  const { 
    actions, 
    getFilteredCategories, 
    getFilteredObjects 
  } = useTaxonomy(filters.locationId);

  const handleFilterChange = (key: keyof ITicketFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleMultiSelectChange = (key: keyof ITicketFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value) 
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const removeFilter = (key: keyof ITicketFilters, value?: string) => {
    if (value && Array.isArray(filters[key])) {
      const currentArray = filters[key] as string[];
      const newArray = currentArray.filter(v => v !== value);
      handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
    } else {
      handleFilterChange(key, undefined);
    }
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          return count + value.length;
        }
        return count + 1;
      }
      return count;
    }, 0);
  };

  const categories = filters.locationId ? getFilteredCategories('') : [];
  const objects = filters.categoryId ? getFilteredObjects(filters.categoryId) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-sm">Filtres</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="h-5 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={getActiveFiltersCount() === 0}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs font-medium">Recherche</Label>
          <Input
            id="search"
            placeholder="Titre ou description..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="h-8"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Statut</Label>
          <div className="flex flex-wrap gap-1">
            {Object.entries(TICKET_STATUSES).map(([value, label]) => (
              <Badge
                key={value}
                variant={filters.status?.includes(value as TicketStatus) ? 'default' : 'outline'}
                className="cursor-pointer h-6 text-xs"
                onClick={() => handleMultiSelectChange('status', value)}
              >
                {label}
                {filters.status?.includes(value as TicketStatus) && (
                  <X 
                    className="h-3 w-3 ml-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFilter('status', value);
                    }}
                  />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Priorité</Label>
          <div className="flex flex-wrap gap-1">
            {Object.entries(TICKET_PRIORITIES).map(([value, label]) => (
              <Badge
                key={value}
                variant={filters.priority?.includes(value as TicketPriority) ? 'default' : 'outline'}
                className="cursor-pointer h-6 text-xs"
                onClick={() => handleMultiSelectChange('priority', value)}
              >
                {label}
                {filters.priority?.includes(value as TicketPriority) && (
                  <X 
                    className="h-3 w-3 ml-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFilter('priority', value);
                    }}
                  />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Lieu</Label>
          <Select 
            value={filters.locationId || ''} 
            onValueChange={(value) => handleFilterChange('locationId', value || undefined)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Sélectionner un lieu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les lieux</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Catégorie</Label>
          <Select 
            value={filters.categoryId || ''} 
            onValueChange={(value) => handleFilterChange('categoryId', value || undefined)}
            disabled={!filters.locationId}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Object */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Objet</Label>
          <Select 
            value={filters.objectId || ''} 
            onValueChange={(value) => handleFilterChange('objectId', value || undefined)}
            disabled={!filters.categoryId}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Sélectionner un objet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les objets</SelectItem>
              {objects.map((object) => (
                <SelectItem key={object.id} value={object.id}>
                  {object.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Last Interaction Days */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Dernière interaction</Label>
          <Select 
            value={filters.lastInteractionDays?.toString() || ''} 
            onValueChange={(value) => handleFilterChange('lastInteractionDays', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Toutes les dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les dates</SelectItem>
              <SelectItem value="1">Dernières 24h</SelectItem>
              <SelectItem value="3">3 derniers jours</SelectItem>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}