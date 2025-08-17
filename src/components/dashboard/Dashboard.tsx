import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Ticket, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Users,
  MessageSquare,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const modules = [
  {
    id: 'locations',
    name: 'Gestion des Lieux',
    description: 'Organiser la hiérarchie des lieux (éléments, groupements, ensembles)',
    icon: MapPin,
    color: 'bg-emerald-500',
    path: '/locations'
  },
  {
    id: 'ticketing',
    name: 'Gestion des Tickets',
    description: 'Créer et suivre les demandes d\'intervention',
    icon: Ticket,
    color: 'bg-blue-500',
    path: '/tickets'
  },
  {
    id: 'documents',
    name: 'Gestion Documentaire',
    description: 'Centraliser et organiser tous vos documents',
    icon: FileText,
    color: 'bg-green-500',
    path: '/documents'
  },
  {
    id: 'surveys',
    name: 'Sondages',
    description: 'Créer et diffuser des enquêtes',
    icon: MessageSquare,
    color: 'bg-purple-500',
    path: '/surveys'
  },
  {
    id: 'reporting',
    name: 'Rapports',
    description: 'Analyser et visualiser les données',
    icon: BarChart3,
    color: 'bg-orange-500',
    path: '/reports'
  },
  {
    id: 'users',
    name: 'Gestion des Utilisateurs',
    description: 'Gérer les utilisateurs et leurs accès aux lieux',
    icon: Users,
    color: 'bg-red-500',
    path: '/users'
  },
  {
    id: 'admin',
    name: 'Administration',
    description: 'Panel d\'administration de la plateforme',
    icon: Settings,
    color: 'bg-gray-600',
    path: '/admin'
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Notifications et messages',
    icon: MessageSquare,
    color: 'bg-teal-500',
    path: '/communication'
  }
];

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      console.log('Attempting to sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Erreur lors de la déconnexion: ' + error.message);
      } else {
        console.log('Sign out successful');
        toast.success('Déconnexion réussie');
        // Ne pas naviguer manuellement, laisser AuthContext gérer la redirection
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      toast.error('Une erreur est survenue lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">ASTRALINK</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Tableau de bord
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <div className="text-right min-w-0 flex-1 sm:flex-initial">
                <p className="text-xs sm:text-sm font-medium truncate">{user?.user_metadata?.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Bienvenue, {user?.user_metadata?.full_name?.split(' ')[0] || 'Utilisateur'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sélectionnez un module pour commencer à gérer vos lieux et votre immeuble
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card 
                key={module.id} 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 group"
                onClick={() => {
                  if (module.id === 'admin') {
                    navigate('/admin');
                  } else if (module.id === 'locations') {
                    navigate('/locations');
                  } else if (module.id === 'users') {
                    navigate('/users');
                  } else {
                    toast.info(`Module ${module.name} - En développement`);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${module.color} text-white group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                  <div className="mt-4">
                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Accéder au module
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 sm:mt-12">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Ticket className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Nouveau ticket</p>
                  <p className="text-sm text-muted-foreground">Créer une demande</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Ajouter document</p>
                  <p className="text-sm text-muted-foreground">Uploader un fichier</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Paramètres</p>
                  <p className="text-sm text-muted-foreground">Configurer l\'espace</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};