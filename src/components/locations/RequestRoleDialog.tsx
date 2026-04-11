import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import { fetchRoles } from '@/services/users';
import { fetchElementsByOrganization, fetchGroupsByOrganization, fetchEnsemblesWithRelations } from '@/services/locations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const log = createLogger('component:request-role-dialog');

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

interface RequestRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

const requestSchema = z.object({
  roleId: z.string().min(1, 'Le rôle est requis'),
  locationType: z.enum(['element', 'group', 'ensemble']).optional(),
  locationId: z.string().optional(),
  message: z.string().optional(),
});

export const RequestRoleDialog: React.FC<RequestRoleDialogProps> = ({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [elements, setElements] = useState<Location[]>([]);
  const [groups, setGroups] = useState<Location[]>([]);
  const [ensembles, setEnsembles] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      roleId: '',
      locationType: undefined,
      locationId: '',
      message: '',
    },
  });

  const locationType = form.watch('locationType');

  const buildRoleHierarchy = (roles: Role[]): Role[] => {
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
      const [rolesData, elementsData, groupsData, ensemblesData] = await Promise.all([
        fetchRoles({ platformScope: false }),
        fetchElementsByOrganization(organizationId),
        fetchGroupsByOrganization(organizationId),
        fetchEnsemblesWithRelations(organizationId),
      ]);

      setRoles(buildRoleHierarchy(rolesData as unknown as Role[]));
      setElements(elementsData as Location[]);
      setGroups(groupsData as Location[]);
      setEnsembles(ensemblesData as Location[]);
    } catch (error) {
      log.error('Error fetching data', { error });
    }
  };

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchData();
    }
  }, [isOpen, organizationId]);

  const getLocationOptions = (locationType: string | undefined) => {
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

  const onSubmit = async (data: z.infer<typeof requestSchema>) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour faire une demande",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        user_id: user.id,
        organization_id: organizationId,
        role_id: data.roleId,
        element_id: data.locationType === 'element' ? data.locationId : null,
        group_id: data.locationType === 'group' ? data.locationId : null,
        ensemble_id: data.locationType === 'ensemble' ? data.locationId : null,
        message: data.message,
      };

      const { error } = await (supabase as any)
        .from('role_requests')
        .insert(requestData);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre demande de rôle a été envoyée",
      });

      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      log.error('Error submitting role request', { error });
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Demander un nouveau rôle</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle demandé *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {renderRoleOptions(roles)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de lieu (optionnel)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type de lieu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="element">Élément</SelectItem>
                      <SelectItem value="group">Groupement</SelectItem>
                      <SelectItem value="ensemble">Ensemble</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {locationType && (
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu spécifique</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le lieu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getLocationOptions(locationType).map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Expliquez pourquoi vous avez besoin de ce rôle..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};