import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  code: string;
  label: { fr: string };
  parent_id: string | null;
  children?: Role[];
}

interface Location {
  id: string;
  name: string;
}

interface UserRole {
  id: string;
  roleId: string;
  locationType: 'element' | 'group' | 'ensemble' | null;
  locationId: string | null;
}

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

const userSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  communicationMode: z.enum(['email', 'sms', 'phone']).default('email'),
});

export const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [elements, setElements] = useState<Location[]>([]);
  const [groups, setGroups] = useState<Location[]>([]);
  const [ensembles, setEnsembles] = useState<Location[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      communicationMode: 'email' as const,
    },
  });

  const buildRoleHierarchy = (roles: any[]): Role[] => {
    const roleMap = new Map();
    const rootRoles: Role[] = [];

    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] });
    });

    roles.forEach(role => {
      const mappedRole = roleMap.get(role.id);
      if (role.parent_id && roleMap.has(role.parent_id)) {
        roleMap.get(role.parent_id).children.push(mappedRole);
      } else {
        rootRoles.push(mappedRole);
      }
    });

    return rootRoles;
  };

  const fetchData = async () => {
    try {
      const [rolesRes, elementsRes, groupsRes, ensemblesRes] = await Promise.all([
        supabase.from('roles').select('*').eq('is_platform_scope', false).order('sort_order'),
        supabase.from('location_elements').select('id, name').eq('organization_id', organizationId),
        supabase.from('location_groups').select('id, name').eq('organization_id', organizationId),
        supabase.from('location_ensembles').select('id, name').eq('organization_id', organizationId),
      ]);

      if (rolesRes.data) {
        setRoles(buildRoleHierarchy(rolesRes.data));
      }
      if (elementsRes.data) setElements(elementsRes.data);
      if (groupsRes.data) setGroups(groupsRes.data);
      if (ensemblesRes.data) setEnsembles(ensemblesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchData();
    }
  }, [isOpen, organizationId]);

  const addUserRole = () => {
    setUserRoles([...userRoles, {
      id: Date.now().toString(),
      roleId: '',
      locationType: null,
      locationId: null,
    }]);
  };

  const updateUserRole = (id: string, field: keyof UserRole, value: any) => {
    setUserRoles(prev => prev.map(role => 
      role.id === id ? { ...role, [field]: value } : role
    ));
  };

  const removeUserRole = (id: string) => {
    setUserRoles(prev => prev.filter(role => role.id !== id));
  };

  const getLocationOptions = (locationType: string | null) => {
    switch (locationType) {
      case 'element':
        return elements;
      case 'group':
        return groups;
      case 'ensemble':
        return ensembles;
      default:
        return [];
    }
  };

  const renderRoleOptions = (rolesArray: Role[], depth = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    
    rolesArray.forEach(role => {
      const indent = '  '.repeat(depth);
      options.push(
        <SelectItem key={role.id} value={role.id}>
          {indent}{role.label?.fr || role.code}
        </SelectItem>
      );
      
      if (role.children && role.children.length > 0) {
        options.push(...renderRoleOptions(role.children, depth + 1));
      }
    });
    
    return options;
  };

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    if (userRoles.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un rôle",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll create a temporary user ID since we can't create actual auth users
      // In a real app, this would involve sending an invitation email
      const tempUserId = crypto.randomUUID();
      
      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: tempUserId,
          full_name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create location memberships
      const memberships = userRoles.map(userRole => ({
        user_id: profile.id,
        organization_id: organizationId,
        role_id: userRole.roleId,
        element_id: userRole.locationType === 'element' ? userRole.locationId : null,
        group_id: userRole.locationType === 'group' ? userRole.locationId : null,
        ensemble_id: userRole.locationType === 'ensemble' ? userRole.locationId : null,
      }));

      const { error: membershipsError } = await supabase
        .from('location_memberships')
        .insert(memberships);

      if (membershipsError) throw membershipsError;

      toast({
        title: "Succès",
        description: "Utilisateur invité avec succès",
      });

      onSuccess();
      onClose();
      form.reset();
      setUserRoles([]);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'inviter l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="communicationMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de communication préféré</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="phone">Téléphone</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Rôles et accès</Label>
                <Button type="button" onClick={addUserRole} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un rôle
                </Button>
              </div>

              {userRoles.map((userRole) => (
                <Card key={userRole.id}>
                  <CardContent className="p-4">
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Rôle</Label>
                        <Select
                          value={userRole.roleId}
                          onValueChange={(value) => updateUserRole(userRole.id, 'roleId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            {renderRoleOptions(roles)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <Label className="text-sm font-medium">Type de lieu</Label>
                        <Select
                          value={userRole.locationType || ''}
                          onValueChange={(value) => {
                            updateUserRole(userRole.id, 'locationType', value || null);
                            updateUserRole(userRole.id, 'locationId', null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="element">Élément</SelectItem>
                            <SelectItem value="group">Groupement</SelectItem>
                            <SelectItem value="ensemble">Ensemble</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <Label className="text-sm font-medium">Lieu</Label>
                        <Select
                          value={userRole.locationId || ''}
                          onValueChange={(value) => updateUserRole(userRole.id, 'locationId', value)}
                          disabled={!userRole.locationType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le lieu" />
                          </SelectTrigger>
                          <SelectContent>
                            {getLocationOptions(userRole.locationType).map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUserRole(userRole.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {userRoles.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Aucun rôle ajouté. Cliquez sur "Ajouter un rôle" pour commencer.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Invitation...' : 'Inviter l\'utilisateur'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};