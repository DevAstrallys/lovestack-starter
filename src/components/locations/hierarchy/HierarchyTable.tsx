import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HierarchyItem } from './types';

interface HierarchyTableProps {
  items: HierarchyItem[];
  childLabel: string;
  icon: LucideIcon;
  onEdit: (item: HierarchyItem) => void;
  onDelete: (id: string) => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const HierarchyTable: React.FC<HierarchyTableProps> = ({
  items, childLabel, icon: Icon, onEdit, onDelete,
}) => (
  <div className="border rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>{capitalize(childLabel)}</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Créé le</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
            <TableCell>
              <div className="flex items-center text-sm text-muted-foreground">
                <Icon className="h-3 w-3 mr-1" />
                {item.children?.length || 0} {childLabel}
              </div>
              {item.children && item.children.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.children.slice(0, 2).map((child) => (
                    <Badge key={child.id} variant="outline" className="text-xs">
                      {child.name}
                    </Badge>
                  ))}
                  {item.children.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.children.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </TableCell>
            <TableCell>
              {item.tags && item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                  {item.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{item.tags.length - 2}
                    </Badge>
                  )}
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
