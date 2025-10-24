import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { AlertCircle, Building2, FolderTree, Layers, QrCode, Users, Tags, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const locationModules = [
  {
    id: 'elements',
    name: 'Éléments',
    description: 'Unités de base (bureaux, salles, zones)',
    icon: MapPin,
    color: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500',
    position: 'top-[20%] left-[10%]',
    size: 'w-48 h-48'
  },
  {
    id: 'groupements',
    name: 'Groupements',
    description: 'Regrouper des éléments (étages, bâtiments)',
    icon: FolderTree,
    color: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-500',
    position: 'top-[15%] left-[35%]',
    size: 'w-56 h-56'
  },
  {
    id: 'ensembles',
    name: 'Ensembles',
    description: 'Ensembles de groupements (sites, campus)',
    icon: Layers,
    color: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-500',
    position: 'top-[10%] right-[15%]',
    size: 'w-64 h-64'
  },
  {
    id: 'qrcodes',
    name: 'QR Codes',
    description: 'Gérer les codes QR des lieux',
    icon: QrCode,
    color: 'from-orange-500 to-orange-600',
    iconBg: 'bg-orange-500',
    position: 'top-[55%] left-[15%]',
    size: 'w-44 h-44'
  },
  {
    id: 'users',
    name: 'Utilisateurs',
    description: 'Gérer les accès aux lieux',
    icon: Users,
    color: 'from-red-500 to-red-600',
    iconBg: 'bg-red-500',
    position: 'top-[60%] left-[45%]',
    size: 'w-52 h-52'
  },
  {
    id: 'tags',
    name: 'Tags',
    description: 'Organiser avec des étiquettes',
    icon: Tags,
    color: 'from-teal-500 to-teal-600',
    iconBg: 'bg-teal-500',
    position: 'bottom-[15%] right-[20%]',
    size: 'w-48 h-48'
  }
];

export const LocationsVisualView: React.FC = () => {
  const { selectedOrganization, loading, isplatformAdmin } = useOrganization();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!selectedOrganization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune organisation sélectionnée</h3>
            <p className="text-muted-foreground mb-4">
              {isplatformAdmin 
                ? "Sélectionnez une organisation pour gérer ses lieux." 
                : "Vous devez être assigné à une organisation pour gérer les lieux."}
            </p>
            <p className="text-sm text-muted-foreground">
              {!isplatformAdmin && "Contactez votre administrateur pour être assigné à une organisation."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur d'organisation pour les admins plateforme */}
      {isplatformAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Sélection d'Organisation</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Choisissez l'organisation dont vous souhaitez gérer les lieux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationSelector />
          </CardContent>
        </Card>
      )}

      {/* Organisation actuelle */}
      <Card className="border-2">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organisation actuelle</p>
              <h3 className="text-xl font-bold">{selectedOrganization.name}</h3>
              {selectedOrganization.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedOrganization.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vue 3D isométrique */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardHeader>
          <CardTitle>Modules de Gestion des Lieux</CardTitle>
          <CardDescription>
            Cliquez sur un module pour accéder à sa gestion
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="relative min-h-[600px] w-full">
            {locationModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <div
                  key={module.id}
                  className={cn(
                    'absolute cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 group',
                    module.position,
                    module.size
                  )}
                  onClick={() => {
                    // Scroll to the tabs section and switch to the relevant tab
                    const tabsElement = document.querySelector('[role="tablist"]');
                    if (tabsElement) {
                      tabsElement.scrollIntoView({ behavior: 'smooth' });
                      // Trigger the tab change
                      const tab = document.querySelector(`[value="${module.id}"]`) as HTMLButtonElement;
                      if (tab) {
                        setTimeout(() => tab.click(), 500);
                      }
                    }
                  }}
                >
                  {/* Carte isométrique */}
                  <div 
                    className="relative w-full h-full"
                    style={{
                      transform: 'rotateX(60deg) rotateZ(-45deg)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div 
                      className={cn(
                        'absolute inset-0 rounded-2xl bg-gradient-to-br shadow-2xl',
                        'group-hover:shadow-3xl transition-shadow duration-300',
                        module.color
                      )}
                      style={{
                        transform: 'translateZ(0px)'
                      }}
                    />
                    <div 
                      className="absolute inset-0 rounded-2xl bg-black/20"
                      style={{
                        transform: 'translateZ(-20px)'
                      }}
                    />
                  </div>

                  {/* Label et icône */}
                  <div 
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
                    style={{ transform: 'rotateX(0deg) rotateZ(0deg)' }}
                  >
                    <div className={cn(
                      'p-3 rounded-full shadow-lg',
                      module.iconBg,
                      'text-white'
                    )}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="bg-background border-2 rounded-lg px-4 py-2 shadow-lg">
                      <p className="font-bold text-sm whitespace-nowrap">{module.name}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{module.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
