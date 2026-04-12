import React, { useState, useEffect } from 'react';
import { fetchAllRoles as fetchAllRolesService, fetchPermissions as fetchPermissionsService, fetchRolePermissions as fetchRolePermissionsService, toggleRolePermission as toggleRolePermissionService } from '@/services/roles';
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
  Square,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const log = createLogger('component:roles-permissions');

interface Role {
  id: string;
  code: string;
  label: Record<string, string>;
  is_platform_scope: boolean;
  created_at: string;
  parent_id?: string;
  is_active?: boolean;
  sort_order?: number;
  description?: string;
  children?: Role[];
}

interface Permission {
  id: string;
  code: string;
  label: Record<string, string>;
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
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const buildRoleHierarchy = (roles: Role[]): Role[] => {
    const roleMap = new Map<string, Role>();
    const rootRoles: Role[] = [];

    // First, create a map of all roles
    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] });
    });

    // Then, build the hierarchy
    roles.forEach(role => {
      const roleWithChildren = roleMap.get(role.id)!;
      if (role.parent_id && roleMap.has(role.parent_id)) {
        const parent = roleMap.get(role.parent_id)!;
        parent.children!.push(roleWithChildren);
      } else {
        rootRoles.push(roleWithChildren);
      }
    });

    return rootRoles.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  const fetchData = async () => {
    try {
      const rolesData = await fetchAllRolesService();
      const permissionsData = await fetchPermissionsService();
      const rolePermissionsData = await fetchRolePermissionsService();

      const hierarchicalRoles = buildRoleHierarchy((rolesData || []) as unknown as Role[]);
      setRoles(hierarchicalRoles);
      setPermissions((permissionsData || []) as unknown as Permission[]);
      setRolePermissions((rolePermissionsData || []) as unknown as RolePermission[]);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      log.error('Error fetching roles and permissions', { error });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId: string, permissionId: string) => {
    return rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);
  };

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  const handleToggleRolePermission = async (roleId: string, permissionId: string) => {
    try {
      const exists = hasPermission(roleId, permissionId);
      await toggleRolePermissionService(roleId, permissionId, exists);
      toast.success(exists ? 'Permission retirée' : 'Permission ajoutée');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la modification de la permission');
      log.error('Error toggling permission', { error });
    }
  };

  const getPermissionsByRole = (roleId: string) => {
    return rolePermissions
      .filter(rp => rp.role_id === roleId)
      .map(rp => rp.permissions);
  };

  const renderRoleCard = (role: Role, level: number = 0) => {
    const hasChildren = role.children && role.children.length > 0;
    const isExpanded = expandedRoles.has(role.id);
    const paddingLeft = level * 24;
    const rolePermissionsList = getPermissionsByRole(role.id);

    return (
      <div key={role.id} className="space-y-2">
        <Card className="relative" style={{ marginLeft: `${paddingLeft}px` }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRoleExpansion(role.id)}
                    className="p-1 h-6 w-6"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">{role.code}</CardTitle>
                  <CardDescription>
                    {typeof role.label === 'object' ? role.label?.fr || role.code : role.label}
                    {role.description && <span className="block text-xs mt-1">{role.description}</span>}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge variant={role.is_platform_scope ? "default" : "secondary"}>
                  {role.is_platform_scope ? "Plateforme" : "Organisation"}
                </Badge>
                {role.is_active === false && (
                  <Badge variant="destructive">Archivé</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Permissions ({rolePermissionsList.length})</p>
                <div className="space-y-1">
                  {rolePermissionsList.slice(0, 3).map((permission) => (
                    <Badge key={permission.id} variant="outline" className="text-xs">
                      {permission.code}
                    </Badge>
                  ))}
                  {rolePermissionsList.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{rolePermissionsList.length - 3} autres
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {role.children!.map(child => renderRoleCard(child, level + 1))}
          </div>
        )}
      </div>
    );
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
          <div className="space-y-4">
            {roles.map((role) => renderRoleCard(role))}
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
                              {role.is_platform_scope ? "Platform" : "Organization"}
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