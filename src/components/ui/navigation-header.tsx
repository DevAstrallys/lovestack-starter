import React from 'react';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoleViewSelector } from '@/components/ui/role-view-selector';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationHeaderProps {
  title: string;
  description?: string;
  showRoleSelector?: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({ 
  title, 
  description, 
  showRoleSelector = true 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Ne montrer le sélecteur de rôle que si l'utilisateur est connecté et que c'est autorisé
  const shouldShowRoleSelector = showRoleSelector && user;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        {shouldShowRoleSelector && (
          <div className="flex-1 sm:flex-initial">
            <RoleViewSelector />
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0"
          size="sm"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Accueil</span>
        </Button>
      </div>
    </div>
  );
};