import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Shield, 
  Settings,
  Eye,
  Edit,
  Trash,
  Plus,
  Send,
  Download,
  Upload,
  Lock,
  Unlock,
  Save,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  code: string;
  label: any;
  is_platform_scope: boolean;
  parent_id?: string;
  is_active: boolean;
}

interface Permission {
  id: string;
  code: string;
  label: any;
  category?: string;
  action_type?: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

interface PermissionCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: Permission[];
}

export const PermissionsManager = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savingChanges, setSavingChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, code, label, is_platform_scope, parent_id, is_active')
        .eq('is_active', true)
        .order('code');

      if (rolesError) throw rolesError;

      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('id, code, label')
        .order('code');

      if (permissionsError) throw permissionsError;

      // Fetch role-permissions mapping
      const { data: rolePermissionsData, error: rpError } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id');

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

  const categorizePermissions = (): PermissionCategory[] => {
    const categories: PermissionCategory[] = [
      {
        name: 'Administration',
        icon: Shield,
        permissions: permissions.filter(p => 
          p.code.includes('admin') || 
          p.code.includes('platform') || 
          p.code.includes('organization.manage')
        )
      },
      {
        name: 'Lecture/Consultation',
        icon: Eye,
        permissions: permissions.filter(p => 
          p.code.includes('.read') || 
          p.code.includes('view') || 
          p.code.includes('access')
        )
      },
      {
        name: 'Création/Ajout',
        icon: Plus,
        permissions: permissions.filter(p => 
          p.code.includes('.create')
        )
      },
      {
        name: 'Écriture/Modification',
        icon: Edit,
        permissions: permissions.filter(p => 
          p.code.includes('.write') || 
          p.code.includes('.update') || 
          p.code.includes('manage')
        )
      },
      {
        name: 'Suppression',
        icon: Trash,
        permissions: permissions.filter(p => 
          p.code.includes('.delete') || 
          p.code.includes('remove')
        )
      },
      {
        name: 'Validation/Révision',
        icon: Lock,
        permissions: permissions.filter(p => 
          p.code.includes('.review') || 
          p.code.includes('.validate') || 
          p.code.includes('approve')
        )
      },
      {
        name: 'Communications',
        icon: Send,
        permissions: permissions.filter(p => 
          p.code.includes('notification') || 
          p.code.includes('send') || 
          p.code.includes('comment')
        )
      },
      {
        name: 'Urgences',
        icon: Unlock,
        permissions: permissions.filter(p => 
          p.code.includes('emergency') || 
          p.code.includes('override')
        )
      },
      {
        name: 'Rapports',
        icon: Download,
        permissions: permissions.filter(p => 
          p.code.includes('report') || 
          p.code.includes('audit')
        )
      },
      {
        name: 'Documents',
        icon: Upload,
        permissions: permissions.filter(p => 
          p.code.includes('document')
        )
      },
      {
        name: 'Modules',
        icon: Settings,
        permissions: permissions.filter(p => 
          p.code.includes('module') || 
          p.code.includes('qr_codes')
        )
      }
    ];

    // Add remaining permissions to a "Autres" category
    const categorizedPermissionIds = new Set(
      categories.flatMap(cat => cat.permissions.map(p => p.id))
    );
    
    const uncategorizedPermissions = permissions.filter(p => 
      !categorizedPermissionIds.has(p.id)
    );

    if (uncategorizedPermissions.length > 0) {
      categories.push({
        name: 'Autres',
        icon: Plus,
        permissions: uncategorizedPermissions
      });
    }

    return categories.filter(cat => cat.permissions.length > 0);
  };

  const hasPermission = (roleId: string, permissionId: string): boolean => {
    const key = `${roleId}-${permissionId}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!;
    }
    return rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    const key = `${roleId}-${permissionId}`;
    const currentValue = hasPermission(roleId, permissionId);
    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(key, !currentValue);
    setPendingChanges(newPendingChanges);
  };

  const saveChanges = async () => {
    if (pendingChanges.size === 0) {
      toast.info('Aucune modification à sauvegarder');
      return;
    }

    try {
      setSavingChanges(true);

      for (const [key, hasPermissionValue] of pendingChanges) {
        const [roleId, permissionId] = key.split('-');
        const existingRelation = rolePermissions.some(rp => 
          rp.role_id === roleId && rp.permission_id === permissionId
        );

        if (hasPermissionValue && !existingRelation) {
          // Add permission
          const { error } = await supabase
            .from('role_permissions')
            .insert({ role_id: roleId, permission_id: permissionId });
          
          if (error) throw error;
        } else if (!hasPermissionValue && existingRelation) {
          // Remove permission
          const { error } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', roleId)
            .eq('permission_id', permissionId);
          
          if (error) throw error;
        }
      }

      toast.success(`${pendingChanges.size} modifications sauvegardées`);
      setPendingChanges(new Map());
      await fetchData();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error('Error saving changes:', error);
    } finally {
      setSavingChanges(false);
    }
  };

  const resetChanges = () => {
    setPendingChanges(new Map());
    toast.info('Modifications annulées');
  };

  const selectAllInCategory = (categoryPermissions: Permission[], hasAll: boolean) => {
    if (!selectedRole) return;

    const newPendingChanges = new Map(pendingChanges);
    categoryPermissions.forEach(permission => {
      const key = `${selectedRole}-${permission.id}`;
      newPendingChanges.set(key, !hasAll);
    });
    setPendingChanges(newPendingChanges);
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);
  const categories = categorizePermissions();

  if (loading) {
    return <div className="p-8 text-center">Chargement des permissions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestionnaire de Permissions</h3>
          <p className="text-muted-foreground">
            Configuration granulaire des permissions par rôle
          </p>
        </div>
        
        {pendingChanges.size > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {pendingChanges.size} modification{pendingChanges.size > 1 ? 's' : ''} en attente
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={resetChanges}
              disabled={savingChanges}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={saveChanges}
              disabled={savingChanges}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingChanges ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        )}
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Sélection du Rôle</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Choisir un rôle à configurer" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center space-x-2">
                      <span>{role.code}</span>
                      <Badge variant={role.is_platform_scope ? "default" : "secondary"} className="text-xs">
                        {role.is_platform_scope ? "Plateforme" : "Organisation"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
              {selectedRoleData && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>•</span>
                  <span>{typeof selectedRoleData.label === 'object' ? selectedRoleData.label?.fr || selectedRoleData.code : selectedRoleData.label}</span>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Configuration */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration des Permissions</CardTitle>
            <CardDescription>
              Gérez les permissions pour le rôle sélectionné par catégorie d'actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full" defaultValue={categories.map((_, i) => `category-${i}`)}>
              {categories.map((category, index) => {
                const categoryPermissions = category.permissions;
                const permissionsWithStatus = categoryPermissions.map(permission => ({
                  ...permission,
                  hasPermission: hasPermission(selectedRole, permission.id)
                }));
                
                const checkedCount = permissionsWithStatus.filter(p => p.hasPermission).length;
                const totalCount = categoryPermissions.length;
                const hasAll = checkedCount === totalCount;
                const hasPartial = checkedCount > 0 && checkedCount < totalCount;

                return (
                  <AccordionItem key={index} value={`category-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center space-x-3">
                          {React.createElement(category.icon, { className: "h-5 w-5 text-primary" })}
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {checkedCount}/{totalCount}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllInCategory(categoryPermissions, hasAll)}
                            className="text-xs"
                          >
                            {hasAll ? 'Tout désélectionner' : 'Tout sélectionner'}
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {categoryPermissions.map((permission) => {
                          const isChecked = hasPermission(selectedRole, permission.id);
                          const key = `${selectedRole}-${permission.id}`;
                          const isPending = pendingChanges.has(key);
                          
                          return (
                            <div
                              key={permission.id}
                              className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                isPending 
                                  ? 'bg-yellow-50 border-yellow-200' 
                                  : 'bg-card hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(selectedRole, permission.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{permission.code}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {typeof permission.label === 'object' ? permission.label?.fr || permission.code : permission.label}
                                </div>
                                {isPending && (
                                  <Badge variant="outline" className="text-xs mt-2 bg-yellow-100 text-yellow-700">
                                    {isChecked ? 'À ajouter' : 'À retirer'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {!selectedRole && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez un rôle pour configurer ses permissions</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};