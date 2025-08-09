import React from 'react';
import { LocationsManagement } from '@/components/locations/LocationsManagement';

export const Locations: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <LocationsManagement />
    </div>
  );
};