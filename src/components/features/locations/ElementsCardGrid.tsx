import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, QrCode } from 'lucide-react';
import { LocationElement } from './types';

interface ElementsCardGridProps {
  elements: LocationElement[];
  onEdit: (element: LocationElement) => void;
  onDelete: (id: string) => void;
  onGenerateQR: (id: string, name: string) => void;
}

export const ElementsCardGrid: React.FC<ElementsCardGridProps> = ({ elements, onEdit, onDelete, onGenerateQR }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {elements.map((element) => {
      const locationData = element.location_data as any;
      const hasAddress = locationData?.address || locationData?.city || locationData?.zipCode;

      return (
        <Card key={element.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{element.name}</CardTitle>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(element)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => onGenerateQR(element.id, element.name)} title="Générer QR Code"><QrCode className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(element.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            {element.description && <CardDescription className="text-xs">{element.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hasAddress && (
                <div className="text-xs text-muted-foreground">
                  {locationData?.address && <div>{locationData.address}</div>}
                  {(locationData?.zipCode || locationData?.city) && (
                    <div>
                      {locationData?.zipCode && `${locationData.zipCode} `}
                      {locationData?.city}
                      {locationData?.country && locationData.country !== 'France' && `, ${locationData.country}`}
                    </div>
                  )}
                  {locationData?.qrLocation && <div className="mt-1 text-primary">📍 QR: {locationData.qrLocation}</div>}
                </div>
              )}
              {element.tags && element.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {element.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">Créé le {new Date(element.created_at).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
