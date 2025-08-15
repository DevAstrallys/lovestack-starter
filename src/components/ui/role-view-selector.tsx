import React from 'react';
import { Eye, EyeOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRoleView } from '@/contexts/RoleViewContext';

interface Role {
  id: string;
  code: string;
  label: { fr: string; en: string };
  parent_id: string | null;
  sort_order: number;
  is_platform_scope: boolean;
}

export const RoleViewSelector: React.FC = () => {
  const { simulatedRole, setSimulatedRole, availableRoles, isSimulating, resetToActualRole } = useRoleView();

  // Organiser les rôles par hiérarchie
  const organizeRolesByHierarchy = (roles: Role[]) => {
    const rootRoles = roles.filter(role => !role.parent_id);
    const childRoles = roles.filter(role => role.parent_id);

    const getChildren = (parentId: string): Role[] => {
      return childRoles
        .filter(role => role.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order);
    };

    return rootRoles.map(root => ({
      ...root,
      children: getChildren(root.id)
    }));
  };

  const organizedRoles = organizeRolesByHierarchy(availableRoles);

  const handleRoleSelect = (role: Role) => {
    if (simulatedRole?.id === role.id) {
      resetToActualRole();
    } else {
      setSimulatedRole(role);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isSimulating && (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
          <Eye className="w-3 h-3 mr-1" />
          Simulation: {simulatedRole?.label.fr}
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={isSimulating ? "secondary" : "outline"} 
            size="sm"
            className={isSimulating ? "bg-orange-50 border-orange-200 hover:bg-orange-100" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            {isSimulating ? "Changer vue" : "Simuler vue"}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Sélectionner une vue
          </DropdownMenuLabel>
          
          {isSimulating && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={resetToActualRole}
                className="text-blue-600 font-medium"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Retour à ma vue actuelle
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          {organizedRoles.map(parentRole => (
            <div key={parentRole.id}>
              <DropdownMenuItem
                onClick={() => handleRoleSelect(parentRole)}
                className={`${simulatedRole?.id === parentRole.id ? 'bg-orange-50 text-orange-800' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="font-medium">{parentRole.label.fr}</span>
                  </div>
                  {parentRole.is_platform_scope && (
                    <Badge variant="outline" className="text-xs ml-2">Plateforme</Badge>
                  )}
                </div>
              </DropdownMenuItem>
              
              {parentRole.children && parentRole.children.length > 0 && (
                <div className="ml-4">
                  {parentRole.children.map(childRole => (
                    <DropdownMenuItem
                      key={childRole.id}
                      onClick={() => handleRoleSelect(childRole)}
                      className={`${simulatedRole?.id === childRole.id ? 'bg-orange-50 text-orange-800' : ''} text-sm`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-2 flex items-center justify-center">
                            <div className="w-2 h-px bg-border"></div>
                          </div>
                          <span>{childRole.label.fr}</span>
                        </div>
                        {childRole.is_platform_scope && (
                          <Badge variant="outline" className="text-xs ml-2">Plateforme</Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};