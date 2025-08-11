import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserPlus, Users, Mail, Shield, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LocationElement, LocationGroup, LocationEnsemble } from './LocationsManagement';

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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLocationTypeDialog, setSelectedLocationTypeDialog] = useState<'element' | 'group' | 'ensemble'>('element');
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
    // Simulé pour l'instant - à implémenter avec la vraie structure de données
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@example.com',
        full_name: 'Administrateur Principal',
        memberships: [
          {
            id: '1',
            user_id: '1',
            role_id: 'admin-role',
            location_type: 'ensemble',
            location_id: 'ens-1',
            location_name: 'Ensemble Nord',
            role_name: 'Administrateur',
            role_code: 'admin',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ]
      }
    ];
    setUsers(mockUsers);
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

  const handleAddUser = async () => {
    if (!newUserEmail || !selectedRole || !selectedLocation) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      // Logique d'ajout d'utilisateur à implémenter
      toast({
        title: "Succès",
        description: "Utilisateur ajouté avec succès",
      });
      
      setShowAddDialog(false);
      setNewUserEmail('');
      setSelectedRole('');
      setSelectedLocation('');
      await fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const getLocationOptions = () => {
    switch (selectedLocationTypeDialog) {
      case 'element':
        return elements.map(el => ({ id: el.id, name: el.name }));
      case 'group':
        return groups.map(gr => ({ id: gr.id, name: gr.name }));
      case 'ensemble':
        return ensembles.map(ens => ({ id: ens.id, name: ens.name }));
      default:
        return [];
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
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inviter un utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inviter un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Ajoutez un utilisateur et définissez ses accès aux lieux
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="utilisateur@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location-type">Type de lieu</Label>
                    <Select value={selectedLocationTypeDialog} onValueChange={(value: 'element' | 'group' | 'ensemble') => {
                      setSelectedLocationTypeDialog(value);
                      setSelectedLocation('');
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ensemble">Ensemble</SelectItem>
                        <SelectItem value="group">Groupement</SelectItem>
                        <SelectItem value="element">Élément</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Lieu</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un lieu" />
                      </SelectTrigger>
                      <SelectContent>
                        {getLocationOptions().map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.label?.fr || role.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddUser}>
                      Inviter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                          <div>
                            <div className="font-medium">{primaryRole.location_name}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {primaryRole.location_type}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {activeMemberships.length} accès
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={activeMemberships.length > 0 ? "default" : "secondary"}>
                          {activeMemberships.length > 0 ? 'Actif' : 'Inactif'}
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
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};