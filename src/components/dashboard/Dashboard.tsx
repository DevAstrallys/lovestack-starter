import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Ticket, 
  FileText, 
  BarChart3, 
  Settings, 
  Users,
  MessageSquare,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrgLogo } from '@/components/ui/org-logo';

const modules = [
  {
    id: 'locations',
    name: 'Gestion des Lieux',
    description: 'Hiérarchie des lieux : ensembles, groupements, éléments',
    icon: MapPin,
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    path: '/locations',
    ready: true,
  },
  {
    id: 'ticketing',
    name: 'Gestion des Tickets',
    description: 'Créer et suivre les demandes d\'intervention',
    icon: Ticket,
    gradient: 'from-blue-500/10 to-blue-500/5',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    path: '/tickets',
    ready: true,
  },
  {
    id: 'users',
    name: 'Utilisateurs',
    description: 'Gérer les accès et rôles',
    icon: Users,
    gradient: 'from-violet-500/10 to-violet-500/5',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-100',
    path: '/users',
    ready: true,
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Centraliser tous vos documents',
    icon: FileText,
    gradient: 'from-amber-500/10 to-amber-500/5',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    path: '/documents',
    ready: false,
  },
  {
    id: 'surveys',
    name: 'Sondages',
    description: 'Créer et diffuser des enquêtes',
    icon: MessageSquare,
    gradient: 'from-pink-500/10 to-pink-500/5',
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-100',
    path: '/surveys',
    ready: false,
  },
  {
    id: 'reporting',
    name: 'Rapports',
    description: 'Analyser et visualiser les données',
    icon: BarChart3,
    gradient: 'from-orange-500/10 to-orange-500/5',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    path: '/reports',
    ready: false,
  },
  {
    id: 'admin',
    name: 'Administration',
    description: 'Configuration de la plateforme',
    icon: Settings,
    gradient: 'from-slate-500/10 to-slate-500/5',
    iconColor: 'text-slate-600',
    iconBg: 'bg-slate-100',
    path: '/admin',
    ready: true,
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Notifications et messages',
    icon: MessageSquare,
    gradient: 'from-teal-500/10 to-teal-500/5',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-100',
    path: '/communication',
    ready: false,
  },
];

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedOrganization } = useOrganization();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Utilisateur';

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Bonjour, {firstName}
        </h1>
        <p className="text-muted-foreground text-base">
          {selectedOrganization
            ? `Espace de travail — ${selectedOrganization.name}`
            : 'Sélectionnez un module pour commencer'}
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.id}
              className={`group relative overflow-hidden cursor-pointer border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${!mod.ready ? 'opacity-60' : ''}`}
              onClick={() => {
                if (mod.ready) navigate(mod.path);
                else toast.info(`Module ${mod.name} — En développement`);
              }}
            >
              {/* Subtle gradient bg */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <CardContent className="relative p-6 space-y-4">
                <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${mod.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base text-foreground">{mod.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mod.description}
                  </p>
                </div>
                <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {mod.ready ? 'Accéder' : 'Bientôt disponible'}
                  {mod.ready && <ArrowRight className="ml-1 h-3 w-3" />}
                </div>
              </CardContent>
              
              {!mod.ready && (
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                    Bientôt
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
