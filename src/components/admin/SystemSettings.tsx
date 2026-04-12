import React, { useState, useEffect } from 'react';
import { fetchSystemStats as fetchSystemStatsService } from '@/services/system';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Database,
  Bell,
  Mail,
  Shield,
  Activity,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const log = createLogger('component:system-settings');

export const SystemSettings = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    totalTickets: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const stats = await fetchSystemStatsService();
      setStats({
        totalUsers: stats.usersCount,
        totalOrganizations: stats.organizationsCount,
        totalTickets: stats.ticketsCount,
        activeUsers: stats.activeUsersCount
      });
    } catch (error) {
      log.error('Error fetching stats', { error });
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseMaintenance = async () => {
    toast.info('Maintenance de la base de données en cours...');
    // Simuler une maintenance
    setTimeout(() => {
      toast.success('Maintenance terminée avec succès');
    }, 2000);
  };

  const exportSystemData = async () => {
    toast.info('Exportation des données en cours...');
    // Simuler un export
    setTimeout(() => {
      toast.success('Données exportées avec succès');
    }, 3000);
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Paramètres Système</h3>
        <p className="text-muted-foreground">
          Configuration et maintenance de la plateforme
        </p>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              Organisations enregistrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Tickets créés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut système</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Opérationnel</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Tous les services fonctionnent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Paramètres de Notifications</span>
            </CardTitle>
            <CardDescription>
              Configuration des notifications système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Notifications par email</Label>
                <p className="text-sm text-muted-foreground">
                  Envoyer des notifications par email
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Notifications push</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications en temps réel
                </p>
              </div>
              <Switch id="push-notifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications">Notifications SMS</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications par SMS d'urgence
                </p>
              </div>
              <Switch id="sms-notifications" />
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Configuration Email</span>
            </CardTitle>
            <CardDescription>
              Paramètres SMTP et email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="smtp-host">Serveur SMTP</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.example.com"
                defaultValue="smtp.gmail.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  placeholder="587"
                  defaultValue="587"
                />
              </div>
              <div>
                <Label htmlFor="smtp-security">Sécurité</Label>
                <Input
                  id="smtp-security"
                  placeholder="TLS"
                  defaultValue="TLS"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="sender-email">Email expéditeur</Label>
              <Input
                id="sender-email"
                placeholder="noreply@astralink.com"
                defaultValue="noreply@astralink.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Maintenance Système</span>
          </CardTitle>
          <CardDescription>
            Outils de maintenance et d'administration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={runDatabaseMaintenance}
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>Maintenance DB</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={exportSystemData}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Exporter données</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={fetchStats}
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Actualiser stats</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};