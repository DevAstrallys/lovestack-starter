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
import { deleteUser } from '@/services/admin';
import { fetchLocationMembershipsWithDetails, fetchRoles as fetchUserRoles } from '@/services/users';
import { fetchElementsByOrganization, fetchGroupsByOrganization, fetchEnsemblesWithRelations } from '@/services/locations';
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
  label: Record<string, string> | string;
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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
        fetchEnsemblesData(),
        fetchRolesData()
      ]);
    } catch (error) {
      log.error('Error fetching data', { error });
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
      const memberships = await fetchLocationMembershipsWithDetails({ organizationId });

      // Group memberships by user
      const usersMap = new Map<string, User>();
      
      (memberships || []).forEach((membership: Record<string, unknown>) => {
        const userId = membership.user_id as string;
        const rolesData = membership.roles as Record<string, unknown> | null;
        const elemData = membership.location_elements as Record<string, unknown> | null;
        const grpData = membership.location_groups as Record<string, unknown> | null;
        const ensData = membership.location_ensembles as Record<string, unknown> | null;
        
        const locationName = (elemData?.name || grpData?.name || ensData?.name || 'Lieu inconnu') as string;
        
        const locationType = membership.element_id ? 'element' :
                           membership.group_id ? 'group' :
                           membership.ensemble_id ? 'ensemble' : 'element';

        const userMembership: UserMembership = {
          id: membership.id as string,
          user_id: userId,
          role_id: membership.role_id as string,
          location_type: locationType as 'element' | 'group' | 'ensemble',
          location_id: ((membership.element_id || membership.group_id || membership.ensemble_id) as string) || '',
          location_name: locationName,
          role_name: ((rolesData?.label as Record<string, string>)?.fr || rolesData?.code || 'Rôle inconnu') as string,
          role_code: (rolesData?.code || '') as string,
          is_active: membership.is_active as boolean,
          created_at: membership.created_at as string
        };

        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            id: userId,
            email: `user${userId.slice(0, 8)}@example.com`,
            full_name: 'Utilisateur',
            memberships: []
          });
        }

        usersMap.get(userId)!.memberships.push(userMembership);
      });

      setUsers(Array.from(usersMap.values()));
    } catch (error) {
      log.error('Error fetching users', { error });
      throw error;
    }
  };

  const fetchElements = async () => {
    const data = await fetchElementsByOrganization(organizationId);
    setElements((data || []) as unknown as LocationElement[]);
  };

  const fetchGroups = async () => {
    const data = await fetchGroupsByOrganization(organizationId);
    setGroups(data || []);
  };

  const fetchEnsemblesData = async () => {
    const data = await fetchEnsemblesWithRelations(organizationId);
    setEnsembles((data || []) as unknown as LocationEnsemble[]);
  };

  const fetchRolesData = async () => {
    const data = await fetchUserRoles({ platformScope: false });
    setRoles(data || []);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      toast({
        title: 'Utilisateur supprimé',
        description: `${userToDelete.full_name || 'L\'utilisateur'} a été supprimé avec succès.`,
      });
      fetchUsers();
    } catch (error: unknown) {
      log.error('Error deleting user', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer l\'utilisateur',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
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
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="sm">
                                Gérer
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setUserToDelete(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur <strong>{userToDelete?.full_name || 'Utilisateur'}</strong> sera
              définitivement supprimé, ainsi que tous ses accès. Les tickets associés seront anonymisés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};