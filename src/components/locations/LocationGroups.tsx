import React from 'react';
import { LocationHierarchyManager } from './LocationHierarchyManager';
import {
  fetchGroupsWithRelations,
  fetchElementsByOrganization,
  fetchLocationTags,
  saveGroup,
  deleteGroup,
  createLocationTag,
} from '@/services/locations';
import { MapPin } from 'lucide-react';

interface LocationGroupsProps {
  organizationId: string;
}

export const LocationGroups: React.FC<LocationGroupsProps> = ({ organizationId }) => (
  <LocationHierarchyManager
    organizationId={organizationId}
    level="group"
    title="Groupements de Lieux"
    subtitle="Les groupements permettent de rassembler plusieurs éléments"
    icon={MapPin}
    fetchItems={async (orgId) => {
      const data = await fetchGroupsWithRelations(orgId);
      return data.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        created_at: g.created_at,
        tags: g.tags,
        children: g.elements,
      }));
    }}
    fetchChildren={fetchElementsByOrganization}
    fetchTags={fetchLocationTags}
    saveItem={({ id, name, description, organization_id, selectedChildren, selectedTags }) =>
      saveGroup({ id, name, description, organization_id, selectedElements: selectedChildren, selectedTags })
    }
    deleteItem={deleteGroup}
    createTag={createLocationTag}
    childLabel="élément(s)"
    itemLabel="groupement"
  />
);
