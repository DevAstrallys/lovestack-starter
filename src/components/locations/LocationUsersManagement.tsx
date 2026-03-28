import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, Users, Mail, Shield, Search, X, UserCheck, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('locations:users');
import { LocationElement, LocationGroup, LocationEnsemble } from './LocationsManagement';
import { InviteUserDialog } from './InviteUserDialog';
import { RoleRequestsTab } from './RoleRequestsTab';
import { RequestRoleDialog } from './RequestRoleDialog';

interface UserMembership {
  id: string;
  user_id: string;
  role_id: string;
  location_type: 'element' | 'group' | 'ensemble';
  location_id: string;
  location_name: string;
  role_name: string;
  role_code: string;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  memberships: UserMembership[];
}

interface Role {
  id: string;
  code: string;
  label: any;
}

interface LocationUsersManagementProps {
  organizationId: string;
}

export const LocationUsersManagement: React.FC<LocationUsersManagementProps> = ({ organizationId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [elements, setElements] = useState<LocationElement[]>([]);
  const [groups, setGroups] = useState<LocationGroup[]>([]);
  const [ensembles, setEnsembles] = useState<LocationEnsemble[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<string>('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      fetchData();
    }
  }, [organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchElements(),
        fetchGroups(),
        fetchEnsembles(),
        fetchRoles()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Récupérer les memberships avec les informations des rôles et lieux
      const { data: memberships, error: membershipsError } = await supabase
        .from('location_memberships')
        .select(`
          id,
          user_id,
          role_id,
          element_id,
          group_id,
          ensemble_id,
          is_active,
          created_at,
          roles(id, code, label),
          location_elements(id, name),
          location_groups(id, name),
          location_ensembles(id, name)
        `)
        .eq('organization_id', organizationId);

      if (membershipsError) throw membershipsError;

      // Récupérer les profils des utilisateurs
      const userIds = [...new Set(memberships?.map(m => m.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Grouper les memberships par utilisateur
      const usersMap = new Map<string, User>();
      
      memberships?.forEach((membership: any) => {
        const userId = membership.user_id;
        const profile = profiles?.find(p => p.id === userId);
        const locationName = membership.location_elements?.name || 
                           membership.location_groups?.name || 
                           membership.location_ensembles?.name || 'Lieu inconnu';
        
        const locationType = membership.element_id ? 'element' :
                           membership.group_id ? 'group' :
                           membership.ensemble_id ? 'ensemble' : 'element';

        const userMembership: UserMembership = {
          id: membership.id,
          user_id: userId,
          role_id: membership.role_id,
          location_type: locationType as 'element' | 'group' | 'ensemble',
          location_id: membership.element_id || membership.group_id || membership.ensemble_id || '',
          location_name: locationName,
          role_name: membership.roles?.label?.fr || membership.roles?.code || 'Rôle inconnu',
          role_code: membership.roles?.code || '',
          is_active: membership.is_active,
          created_at: membership.created_at
        };

        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            id: userId,
            email: `user${userId.slice(0, 8)}@example.com`, // Email temporaire
            full_name: profile?.full_name || 'Utilisateur',
            memberships: []
          });
        }

        usersMap.get(userId)!.memberships.push(userMembership);
      });

      setUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchElements = async () => {
    const { data, error } = await supabase
      .from('location_elements')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;
    setElements(data || []);
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('location_groups')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;
    setGroups(data || []);
  };

  const fetchEnsembles = async () => {
    const { data, error } = await supabase
      .from('location_ensembles')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;
    setEnsembles(data || []);
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_platform_scope', false);

    if (error) throw error;
    setRoles(data || []);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedLocationType === 'all') return matchesSearch;
    
    const hasLocationType = user.memberships.some(m => m.location_type === selectedLocationType);
    return matchesSearch && hasLocationType;
  });

  const getRoleHierarchy = (memberships: UserMembership[]) => {
    // Auto-résolution : retourne le rôle avec le plus de droits
    const roleOrder = ['admin', 'manager', 'user', 'viewer'];
    
    for (const roleCode of roleOrder) {
      const membership = memberships.find(m => m.role_code === roleCode && m.is_active);
      if (membership) return membership;
    }
    
    return memberships.find(m => m.is_active) || memberships[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="requests">Demandes de rôles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion des Utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Gérez les utilisateurs et leurs rôles sur les lieux (auto-résolution activée)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsRequestDialogOpen(true)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Demander un rôle
                  </Button>
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Inviter un utilisateur
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher par email ou nom..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Select value={selectedLocationType} onValueChange={setSelectedLocationType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="ensemble">Ensembles</SelectItem>
                    <SelectItem value="group">Groupements</SelectItem>
                    <SelectItem value="element">Éléments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôle principal</TableHead>
                      <TableHead>Lieu principal</TableHead>
                      <TableHead>Nombre d'accès</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const primaryRole = getRoleHierarchy(user.memberships);
                      const activeMemberships = user.memberships.filter(m => m.is_active);
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{user.full_name || 'Nom non défini'}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {primaryRole && (
                              <Badge variant={primaryRole.role_code === 'admin' ? 'default' : 'secondary'}>
                                <Shield className="h-3 w-3 mr-1" />
                                {primaryRole.role_name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {primaryRole && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {primaryRole.location_type === 'element' ? 'Élément' :
                                   primaryRole.location_type === 'group' ? 'Groupement' : 'Ensemble'}
                                </Badge>
                                <span className="text-sm">{primaryRole.location_name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{activeMemberships.length}</span>
                              <span className="text-sm text-muted-foreground">accès actifs</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={activeMemberships.length > 0 ? "default" : "secondary"}>
                              {activeMemberships.length > 0 ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Gérer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchTerm || selectedLocationType !== 'all' 
                              ? 'Aucun utilisateur trouvé avec ces critères'
                              : 'Aucun utilisateur dans cette organisation'
                            }
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests">
          <RoleRequestsTab organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      <InviteUserDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        organizationId={organizationId}
        onSuccess={handleRefresh}
      />

      <RequestRoleDialog
        isOpen={isRequestDialogOpen}
        onClose={() => setIsRequestDialogOpen(false)}
        organizationId={organizationId}
        onSuccess={handleRefresh}
      />
    </div>
  );
};