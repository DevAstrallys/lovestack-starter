import React, { useState } from 'react';
import { LocationsManagement } from '@/components/locations/LocationsManagement';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { LocationsVisualView } from '@/components/locations/LocationsVisualView';

export const Locations: React.FC = () => {
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <NavigationHeader 
          title="Gestion des Lieux" 
          description="Créez et gérez vos organisations et organisez vos lieux" 
        />
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'visual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('visual')}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Vue Visuelle</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Vue Liste</span>
          </Button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <LocationsVisualView />
      ) : (
        <LocationsManagement />
      )}
    </div>
  );
};