import React from 'react';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavigationHeaderProps {
  title: string;
  description?: string;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      <Button
        variant="outline"
        onClick={() => navigate('/')}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Accueil
      </Button>
    </div>
  );
};