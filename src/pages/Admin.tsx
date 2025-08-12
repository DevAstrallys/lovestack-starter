import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Users, 
  Building2, 
  Shield,
  Settings,
  UserPlus,
  Building
} from 'lucide-react';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { OrganizationsManagement } from '@/components/admin/OrganizationsManagement';
import { RolesPermissions } from '@/components/admin/RolesPermissions';
import { SystemSettings } from '@/components/admin/SystemSettings';

export const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('organizations');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Accueil
              </Button>
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Administration</h1>
                <p className="text-sm text-muted-foreground">
                  Gestion de la plateforme
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Admin</Badge>
              <div className="text-right">
                <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Admin Overview */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel d'Administration</h2>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et permissions de la plateforme
          </p>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="organizations" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Organisations</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Rôles & Permissions</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <OrganizationsManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="permissions">
            <RolesPermissions />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};