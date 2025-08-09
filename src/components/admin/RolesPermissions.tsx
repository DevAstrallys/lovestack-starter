import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Key,
  Users,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  code: string;
  label: any;
  is_platform_scope: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  code: string;
  label: any;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
  roles: Role;
  permissions: Permission;
}

export const RolesPermissions = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('code');

      if (rolesError) throw rolesError;

      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('code');

      if (permissionsError) throw permissionsError;

      // Fetch role-permissions mapping
      const { data: rolePermissionsData, error: rpError } = await supabase
        .from('role_permissions')
        .select(`
          role_id,
          permission_id,
          roles (id, code, label, is_platform_scope, created_at),
          permissions (id, code, label)
        `);

      if (rpError) throw rpError;

      setRoles(rolesData || []);
      setPermissions(permissionsData || []);
      setRolePermissions(rolePermissionsData || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId: string, permissionId: string) => {
    return rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);
  };

  const toggleRolePermission = async (roleId: string, permissionId: string) => {
    try {
      const exists = hasPermission(roleId, permissionId);
      
      if (exists) {
        // Remove permission
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .eq('permission_id', permissionId);
        
        if (error) throw error;
        toast.success('Permission retirée');
      } else {
        // Add permission
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role_id: roleId, permission_id: permissionId });
        
        if (error) throw error;
        toast.success('Permission ajoutée');
      }
      
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la modification de la permission');
      console.error('Error toggling permission:', error);
    }
  };

  const getPermissionsByRole = (roleId: string) => {
    return rolePermissions
      .filter(rp => rp.role_id === roleId)
      .map(rp => rp.permissions);
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Rôles & Permissions</h3>
        <p className="text-muted-foreground">
          Gérez les rôles et leurs permissions associées
        </p>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="matrix">Matrice</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              const rolePermissions = getPermissionsByRole(role.id);
              return (
                <Card key={role.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{role.code}</CardTitle>
                      </div>
                      <Badge variant={role.is_platform_scope ? "default" : "secondary"}>
                        {role.is_platform_scope ? "Plateforme" : "Bâtiment"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Libellé</p>
                        <p className="text-sm text-muted-foreground">
                          {typeof role.label === 'object' ? role.label?.fr || role.code : role.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Permissions ({rolePermissions.length})</p>
                        <div className="space-y-1">
                          {rolePermissions.slice(0, 3).map((permission) => (
                            <Badge key={permission.id} variant="outline" className="text-xs">
                              {permission.code}
                            </Badge>
                          ))}
                          {rolePermissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{rolePermissions.length - 3} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissions.map((permission) => (
              <Card key={permission.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{permission.code}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {typeof permission.label === 'object' ? permission.label?.fr || permission.code : permission.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Matrice Rôles-Permissions</CardTitle>
              <CardDescription>
                Gérez les permissions pour chaque rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Permission</TableHead>
                      {roles.map((role) => (
                        <TableHead key={role.id} className="text-center min-w-[120px]">
                          <div>
                            <p className="font-medium">{role.code}</p>
                            <Badge 
                              variant={role.is_platform_scope ? "default" : "secondary"}
                              className="text-xs mt-1"
                            >
                              {role.is_platform_scope ? "Platform" : "Building"}
                            </Badge>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{permission.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {typeof permission.label === 'object' ? permission.label?.fr || permission.code : permission.label}
                            </p>
                          </div>
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRolePermission(role.id, permission.id)}
                            >
                              {hasPermission(role.id, permission.id) ? (
                                <CheckSquare className="h-5 w-5 text-green-600" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400" />
                              )}
                            </Button>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};