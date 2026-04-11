import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // TODO: migrer les requêtes restantes vers services
import { getCurrentUser } from '@/services/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RoleRequest {
  id: string;
  user_id: string;
  role_id: string;
  element_id: string | null;
  group_id: string | null;
  ensemble_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  requested_at: string;
  profiles: {
    full_name: string;
  };
  roles: {
    code: string;
    label: { fr: string };
  };
  location_elements?: { name: string };
  location_groups?: { name: string };
  location_ensembles?: { name: string };
}

interface RoleRequestsTabProps {
  organizationId: string;
}

export const RoleRequestsTab: React.FC<RoleRequestsTabProps> = ({ organizationId }) => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('role_requests')
        .select(`
          *,
          profiles!role_requests_user_id_fkey(full_name),
          roles(code, label),
          location_elements(name),
          location_groups(name),
          location_ensembles(name)
        `)
        .eq('organization_id', organizationId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching role requests:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes de rôles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchRequests();
    }
  }, [organizationId]);

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      if (action === 'approved') {
        // Create the location membership
        const { error: membershipError } = await supabase
          .from('location_memberships')
          .insert({
            user_id: request.user_id,
            organization_id: organizationId,
            role_id: request.role_id,
            element_id: request.element_id,
            group_id: request.group_id,
            ensemble_id: request.ensemble_id,
          });

        if (membershipError) throw membershipError;
      }

      // Update the request status
      const { error: updateError } = await (supabase as any)
        .from('role_requests')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await getCurrentUser())?.id,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: `Demande ${action === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande",
        variant: "destructive",
      });
    }
  };

  const getLocationName = (request: RoleRequest) => {
    if (request.location_elements) return request.location_elements.name;
    if (request.location_groups) return request.location_groups.name;
    if (request.location_ensembles) return request.location_ensembles.name;
    return 'Organisation entière';
  };

  const getLocationType = (request: RoleRequest) => {
    if (request.element_id) return 'Élément';
    if (request.group_id) return 'Groupement';
    if (request.ensemble_id) return 'Ensemble';
    return 'Organisation';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><Check className="h-3 w-3 mr-1" />Approuvée</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><X className="h-3 w-3 mr-1" />Rejetée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Chargement des demandes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demandes d'ajout de rôles</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune demande de rôle en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle demandé</TableHead>
                  <TableHead>Type de lieu</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Date de demande</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.profiles?.full_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {request.roles?.label?.fr || request.roles?.code}
                      </Badge>
                    </TableCell>
                    <TableCell>{getLocationType(request)}</TableCell>
                    <TableCell className="max-w-32 truncate">{getLocationName(request)}</TableCell>
                    <TableCell>
                      {format(new Date(request.requested_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">{request.message || '-'}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleRequestAction(request.id, 'approved')}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleRequestAction(request.id, 'rejected')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};