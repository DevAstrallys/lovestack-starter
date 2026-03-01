import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { navigateTo } from '@/lib/navigation';
import { 
  ArrowLeft,
  Users, 
  Building2, 
  Shield,
  Settings,
  UserPlus,
  Building,
  Mail,
  Palette
} from 'lucide-react';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { OrganizationsManagement } from '@/components/admin/OrganizationsManagement';
import { RolesPermissions } from '@/components/admin/RolesPermissions';
import { PermissionsManager } from '@/components/admin/PermissionsManager';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { EmailTester } from '@/components/admin/EmailTester';
import { EmailTemplatesManager } from '@/components/admin/EmailTemplatesManager';
import { VisualIdentitySettings } from '@/components/admin/VisualIdentitySettings';

export const Admin = () => {
  const { user } = useAuth();
  const { selectedOrganization, isplatformAdmin } = useOrganization();
  const [activeTab, setActiveTab] = useState('organizations');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigateTo('/')}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Accueil</span>
              </Button>
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Administration</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gestion de la plateforme
                  {selectedOrganization && ` - ${selectedOrganization.name}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <Badge variant="secondary" className="shrink-0">Admin</Badge>
              <div className="text-right min-w-0 flex-1 sm:flex-initial">
                <p className="text-xs sm:text-sm font-medium truncate">{user?.user_metadata?.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Organization Selector for Platform Admins */}
        {isplatformAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Sélection d'Organisation</CardTitle>
              <CardDescription>
                Choisissez l'organisation à administrer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSelector />
            </CardContent>
          </Card>
        )}

        {/* Admin Overview */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Panel d'Administration</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez les utilisateurs et permissions de la plateforme
            {selectedOrganization && ` pour ${selectedOrganization.name}`}
          </p>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full min-w-[900px] grid-cols-8 h-auto p-1">
              <TabsTrigger value="organizations" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Organisations</span>
                <span className="sm:hidden">Org.</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Utilisateurs</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Rôles & Permissions</span>
                <span className="sm:hidden">Rôles</span>
              </TabsTrigger>
              <TabsTrigger value="permissions-manager" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Config Permissions</span>
                <span className="sm:hidden">Config</span>
              </TabsTrigger>
              <TabsTrigger value="email-test" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Test Email</span>
                <span className="sm:hidden">Test</span>
              </TabsTrigger>
              <TabsTrigger value="email-templates" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">Tpl.</span>
              </TabsTrigger>
              <TabsTrigger value="visual-identity" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Marque</span>
                <span className="sm:hidden">WL</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Paramètres</span>
                <span className="sm:hidden">Param.</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="organizations">
            <OrganizationsManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="permissions">
            <RolesPermissions />
          </TabsContent>

          <TabsContent value="permissions-manager">
            <PermissionsManager />
          </TabsContent>

          <TabsContent value="email-test">
            <EmailTester />
          </TabsContent>

          <TabsContent value="email-templates">
            <EmailTemplatesManager />
          </TabsContent>

          <TabsContent value="visual-identity">
            <VisualIdentitySettings />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};