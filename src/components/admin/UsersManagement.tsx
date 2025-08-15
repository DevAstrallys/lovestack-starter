import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  locale: string | null;
  created_at: string;
}

interface Membership {
  id: string;
  organization_id: string | null;
  role_id: string;
  is_active: boolean;
  can_validate_user_requests: boolean;
  organizations: {
    name: string;
  } | null;
  roles: {
    code: string;
    label: any;
  };
}

interface UserWithMemberships extends Profile {
  memberships: Membership[];
}

export const UsersManagement = () => {
  const [users, setUsers] = useState<UserWithMemberships[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithMemberships | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newMembershipForm, setNewMembershipForm] = useState({
    organizationId: '',
    roleId: '',
    canValidateUserRequests: false
  });

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          memberships (
            id,
            organization_id,
            role_id,
            is_active,
            can_validate_user_requests,
            organizations (name),
            roles (code, label)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*');
      
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: UserWithMemberships) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const addMembership = async () => {
    if (!selectedUser || !newMembershipForm.organizationId || !newMembershipForm.roleId) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const { error } = await supabase
        .from('memberships')
        .insert({
          user_id: selectedUser.id,
          organization_id: newMembershipForm.organizationId,
          role_id: newMembershipForm.roleId,
          is_active: true,
          can_validate_user_requests: newMembershipForm.canValidateUserRequests
        });

      if (error) throw error;
      
      toast.success('Membership ajouté avec succès');
      fetchUsers();
      setIsEditDialogOpen(false);
      setNewMembershipForm({
        organizationId: '',
        roleId: '',
        canValidateUserRequests: false
      });
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du membership');
      console.error('Error adding membership:', error);
    }
  };

  const toggleMembership = async (membershipId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ is_active: !isActive })
        .eq('id', membershipId);

      if (error) throw error;
      
      toast.success('Membership mis à jour');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error('Error updating membership:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestion des Utilisateurs</h3>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs accès aux organisations
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Inviter un utilisateur
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Liste de tous les utilisateurs de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Memberships</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Sans nom'}</p>
                        <p className="text-sm text-muted-foreground">{user.id}</p>
                        {user.phone && (
                          <p className="text-xs text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.memberships?.length > 0 ? (
                        user.memberships.map((membership) => (
                           <div key={membership.id} className="flex items-center space-x-2">
                               <Badge 
                                 variant={membership.is_active ? "default" : "secondary"}
                                 className="text-xs"
                               >
                                 {membership.organizations?.name || 'Plateforme'}
                               </Badge>
                             <Badge variant="outline" className="text-xs">
                               {membership.roles.code}
                             </Badge>
                             {membership.can_validate_user_requests && (
                               <Badge variant="secondary" className="text-xs flex items-center">
                                 <UserCheck className="h-3 w-3 mr-1" />
                                 Validateur
                               </Badge>
                             )}
                           </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Aucun membership</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer l'utilisateur</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name || 'Utilisateur sans nom'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Current Memberships */}
              <div>
                <h4 className="font-medium mb-3">Memberships actuels</h4>
                <div className="space-y-2">
                  {selectedUser.memberships?.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{membership.organizations?.name || 'Plateforme'}</p>
                            <p className="text-sm text-muted-foreground">Rôle: {membership.roles.code}</p>
                          </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={membership.is_active ? "default" : "secondary"}>
                          {membership.is_active ? "Actif" : "Inactif"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMembership(membership.id, membership.is_active)}
                        >
                          {membership.is_active ? "Désactiver" : "Activer"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

               {/* Add New Membership */}
               <div>
                 <h4 className="font-medium mb-3">Ajouter un membership</h4>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="organization">Organisation</Label>
                      <Select 
                        value={newMembershipForm.organizationId} 
                        onValueChange={(value) => setNewMembershipForm(prev => ({ ...prev, organizationId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une organisation" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((organization) => (
                            <SelectItem key={organization.id} value={organization.id}>
                              {organization.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                   <div>
                     <Label htmlFor="role">Rôle</Label>
                     <Select 
                       value={newMembershipForm.roleId} 
                       onValueChange={(value) => setNewMembershipForm(prev => ({ ...prev, roleId: value }))}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Sélectionner un rôle" />
                       </SelectTrigger>
                       <SelectContent>
                         {roles.map((role) => (
                           <SelectItem key={role.id} value={role.id}>
                             {role.code}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                 
                 <div className="flex items-center space-x-2 mb-4">
                   <Checkbox 
                     id="canValidateUserRequests"
                     checked={newMembershipForm.canValidateUserRequests}
                     onCheckedChange={(checked) => 
                       setNewMembershipForm(prev => ({ 
                         ...prev, 
                         canValidateUserRequests: checked === true 
                       }))
                     }
                   />
                   <Label htmlFor="canValidateUserRequests" className="text-sm">
                     Peut valider les demandes d'utilisateurs
                   </Label>
                 </div>
                 
                 <Button onClick={addMembership} className="mt-3">
                   Ajouter le membership
                 </Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};