import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface HierarchyEmptyStatesProps {
  filteredCount: number;
  totalCount: number;
  itemLabel: string;
}

export const HierarchyEmptyStates: React.FC<HierarchyEmptyStatesProps> = ({
  filteredCount, totalCount, itemLabel,
}) => (
  <>
    {filteredCount === 0 && totalCount > 0 && (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Aucun {itemLabel} ne correspond aux critères de recherche.</p>
        </CardContent>
      </Card>
    )}
    {totalCount === 0 && (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Aucun {itemLabel} créé pour cette organisation.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cliquez sur &quot;Nouveau&quot; pour créer votre premier {itemLabel}.
          </p>
        </CardContent>
      </Card>
    )}
  </>
);
