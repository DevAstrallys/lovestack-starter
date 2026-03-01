import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { 
  Users, 
  Building2, 
  Shield,
  Settings,
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
    <AppLayout>
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion de la plateforme
              {selectedOrganization && ` — ${selectedOrganization.name}`}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">Admin</Badge>
        </div>

        {/* Organization Selector */}
        {isplatformAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Organisation</CardTitle>
              <CardDescription className="text-sm">
                Choisissez l'organisation à administrer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSelector />
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full min-w-[900px] grid-cols-8 h-auto p-1">
              <TabsTrigger value="organizations" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Organisations</span>
                <span className="sm:hidden">Org.</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Utilisateurs</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Rôles</span>
                <span className="sm:hidden">Rôles</span>
              </TabsTrigger>
              <TabsTrigger value="permissions-manager" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Permissions</span>
                <span className="sm:hidden">Perm.</span>
              </TabsTrigger>
              <TabsTrigger value="email-test" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Test Email</span>
                <span className="sm:hidden">Test</span>
              </TabsTrigger>
              <TabsTrigger value="email-templates" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">Tpl.</span>
              </TabsTrigger>
              <TabsTrigger value="visual-identity" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Marque</span>
                <span className="sm:hidden">WL</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Paramètres</span>
                <span className="sm:hidden">Param.</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="organizations"><OrganizationsManagement /></TabsContent>
          <TabsContent value="users"><UsersManagement /></TabsContent>
          <TabsContent value="permissions"><RolesPermissions /></TabsContent>
          <TabsContent value="permissions-manager"><PermissionsManager /></TabsContent>
          <TabsContent value="email-test"><EmailTester /></TabsContent>
          <TabsContent value="email-templates"><EmailTemplatesManager /></TabsContent>
          <TabsContent value="visual-identity"><VisualIdentitySettings /></TabsContent>
          <TabsContent value="settings"><SystemSettings /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};
