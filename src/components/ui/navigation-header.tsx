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
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {shouldShowRoleSelector && (
          <RoleViewSelector />
        )}
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Accueil
        </Button>
      </div>
    </div>
  );
};