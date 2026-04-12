import React from 'react';
import { LocationHierarchyManager } from './LocationHierarchyManager';
import {
  fetchEnsemblesWithRelations,
  fetchGroupsByOrganization,
  fetchLocationTags,
  saveEnsemble,
  deleteEnsemble,
  createLocationTag,
} from '@/services/locations';
import { Building } from 'lucide-react';

interface LocationEnsemblesProps {
  organizationId: string;
}

export const LocationEnsembles: React.FC<LocationEnsemblesProps> = ({ organizationId }) => (
  <LocationHierarchyManager
    organizationId={organizationId}
    level="ensemble"
    title="Ensembles de Lieux"
    subtitle="Les ensembles permettent de rassembler plusieurs groupements pour une vision macro"
    icon={Building}
    fetchItems={async (orgId) => {
      const data = await fetchEnsemblesWithRelations(orgId);
      return data.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        created_at: e.created_at,
        tags: e.tags,
        children: e.groups,
      }));
    }}
    fetchChildren={fetchGroupsByOrganization}
    fetchTags={fetchLocationTags}
    saveItem={({ id, name, description, organization_id, selectedChildren, selectedTags }) =>
      saveEnsemble({ id, name, description, organization_id, selectedGroups: selectedChildren, selectedTags })
    }
    deleteItem={deleteEnsemble}
    createTag={createLocationTag}
    childLabel="groupement(s)"
    itemLabel="ensemble"
  />
);
