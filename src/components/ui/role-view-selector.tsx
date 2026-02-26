import React from 'react';
import { Eye, EyeOff, Users, MapPin, Building, Layers } from 'lucide-react';
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
import { useRoleView, UserLocationMembership } from '@/contexts/RoleViewContext';

const locationIcon = (type: string) => {
  switch (type) {
    case 'ensemble': return <Layers className="w-3 h-3" />;
    case 'group': return <Building className="w-3 h-3" />;
    default: return <MapPin className="w-3 h-3" />;
  }
};

const locationLabel = (type: string) => {
  switch (type) {
    case 'ensemble': return 'Ensemble';
    case 'group': return 'Groupement';
    default: return 'Élément';
  }
};

export const RoleViewSelector: React.FC = () => {
  const { 
    simulatedRole, setSimulatedRole, availableRoles, isSimulating, resetToActualRole,
    userMemberships, activeMembership, setActiveMembership 
  } = useRoleView();

  const handleMembershipSelect = (m: UserLocationMembership) => {
    if (activeMembership?.id === m.id) {
      resetToActualRole();
    } else {
      setActiveMembership(m);
      setSimulatedRole(m.role);
    }
  };

  const activeLabel = activeMembership
    ? `${activeMembership.role.label.fr} — ${activeMembership.location_name}`
    : simulatedRole?.label.fr;

  return (
    <div className="flex items-center gap-2">
      {(isSimulating || activeMembership) && (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 max-w-[200px] truncate">
          <Eye className="w-3 h-3 mr-1 shrink-0" />
          <span className="truncate">{activeLabel}</span>
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
            {isSimulating ? "Changer vue" : "Mes vues"}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
          {isSimulating && (
            <>
              <DropdownMenuItem 
                onClick={resetToActualRole}
                className="text-blue-600 font-medium"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Retour à ma vue par défaut
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {userMemberships.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                Mes affectations
              </DropdownMenuLabel>
              {userMemberships.map(m => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => handleMembershipSelect(m)}
                  className={activeMembership?.id === m.id ? 'bg-orange-50 text-orange-800' : ''}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {locationIcon(m.location_type)}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{m.location_name}</div>
                        <div className="text-xs text-muted-foreground">{m.role.label.fr}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {locationLabel(m.location_type)}
                    </Badge>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {userMemberships.length === 0 && (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Aucune affectation de lieu
            </div>
          )}

          {/* Admin simulation section */}
          {availableRoles.some(r => r.is_platform_scope) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                Simulation (Admin)
              </DropdownMenuLabel>
              {availableRoles.filter(r => !r.is_platform_scope).map(role => (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => {
                    setActiveMembership(null);
                    setSimulatedRole(simulatedRole?.id === role.id ? null : role);
                  }}
                  className={`text-sm ${simulatedRole?.id === role.id && !activeMembership ? 'bg-orange-50 text-orange-800' : ''}`}
                >
                  <Eye className="w-3 h-3 mr-2" />
                  {role.label.fr}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
