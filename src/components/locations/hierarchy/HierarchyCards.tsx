import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HierarchyItem } from './types';

interface HierarchyCardsProps {
  items: HierarchyItem[];
  childLabel: string;
  icon: LucideIcon;
  onEdit: (item: HierarchyItem) => void;
  onDelete: (id: string) => void;
}

export const HierarchyCards: React.FC<HierarchyCardsProps> = ({
  items, childLabel, icon: Icon, onEdit, onDelete,
}) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => (
      <Card key={item.id}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{item.name}</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {item.description && (
            <CardDescription className="text-xs">{item.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {item.children && item.children.length > 0 && (
              <div>
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                  <Icon className="h-3 w-3 mr-1" />
                  {item.children.length} {childLabel}
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.children.slice(0, 3).map((child) => (
                    <Badge key={child.id} variant="outline" className="text-xs">
                      {child.name}
                    </Badge>
                  ))}
                  {item.children.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.children.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Créé le {new Date(item.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
