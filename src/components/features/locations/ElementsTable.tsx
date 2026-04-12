import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, QrCode } from 'lucide-react';
import { LocationElement } from './types';
import type { LocationData } from '@/types';

interface ElementsTableProps {
  elements: LocationElement[];
  onEdit: (element: LocationElement) => void;
  onDelete: (id: string) => void;
  onGenerateQR: (id: string, name: string) => void;
}

function formatAddress(locationData: LocationData | null): string {
  return [
    locationData?.address,
    locationData?.zipCode && locationData?.city
      ? `${locationData.zipCode} ${locationData.city}`
      : locationData?.city || locationData?.zipCode,
    locationData?.country && locationData.country !== 'France' ? locationData.country : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export const ElementsTable: React.FC<ElementsTableProps> = ({ elements, onEdit, onDelete, onGenerateQR }) => (
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Adresse</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>QR Location</TableHead>
            <TableHead>Date création</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {elements.map((element) => {
            const locationData = element.location_data as LocationData | null;
            return (
              <TableRow key={element.id}>
                <TableCell className="font-medium">{element.name}</TableCell>
                <TableCell className="max-w-xs truncate">{element.description || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{formatAddress(locationData) || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {element.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
                    ))}
                    {element.tags && element.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">+{element.tags.length - 2}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{locationData?.qrLocation || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(element.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(element)} title="Modifier"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => onGenerateQR(element.id, element.name)} title="Générer QR Code"><QrCode className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(element.id)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
