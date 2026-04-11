import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import { fetchRoles as fetchRolesService } from '@/services/users';
import { createMembership, createLocationMembership } from '@/services/admin';
import { fetchMembershipsWithDetails, fetchLocationMembershipsWithDetails } from '@/services/users';
import { fetchEnsemblesWithRelations, fetchGroupsByOrganization, fetchElementsByOrganization } from '@/services/locations';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, isPast, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Shield,
  UserPlus,
  CalendarClock,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  MapPin,
  CalendarIcon,
  Users,
  Activity,
  Eye
} from 'lucide-react';

const log = createLogger('component:access-security');

interface MemberAccess {
  id: string;
  user_id: string;
  role_code: string;
  role_label: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  organization_name: string | null;
  user_name: string | null;
  source: 'membership' | 'location_membership';
  location_type?: string;
  location_name?: string;
}

interface Role {
  id: string;
  code: string;
  label: { fr: string; en: string };
  description: string | null;
}

interface LocationOption {
  id: string;
  name: string;
  type: 'ensemble' | 'group' | 'element';
}

const TEMPORAL_ROLES = ['expert_auditeur', 'prestataire', 'pompier', 'police', 'urgence_secours', 'data_client'];

export const AccessSecurityManager = () => {
  const { selectedOrganization } = useOrganization();
  const [members, setMembers] = useState<MemberAccess[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState('members');

  // Add form state
  const [addForm, setAddForm] = useState({
    email: '',
    roleId: '',
    scopeType: 'organization' as 'organization' | 'ensemble' | 'group' | 'element',
    locationId: '',
    expiresAt: null as Date | null,
  });

  const fetchData = useCallback(async () => {
    if (!selectedOrganization) return;
    setLoading(true);

    try {
      // Fetch memberships via service
      const memberships = await fetchMembershipsWithDetails({ organizationId: selectedOrganization.id });

      // Fetch location_memberships via service
      const locMemberships = await fetchLocationMembershipsWithDetails({ organizationId: selectedOrganization.id });

      const allMembers: MemberAccess[] = [];

      // Process memberships
      (memberships || []).forEach((m) => {
        allMembers.push({
          id: (m as Record<string, unknown>).id as string,
          user_id: m.user_id,
          role_code: (m.roles as Record<string, unknown>)?.code as string || '?',
          role_label: ((m.roles as Record<string, unknown>)?.label as Record<string, string>)?.fr || (m.roles as Record<string, unknown>)?.code as string || '?',
          is_active: m.is_active,
          expires_at: m.expires_at,
          created_at: m.created_at,
          organization_name: m.organizations?.name || null,
          user_name: m.profiles?.full_name || null,
          source: 'membership',
        });
      });

      // Process location memberships
      (locMemberships || []).forEach((lm) => {
        const locType = lm.ensemble_id ? 'ensemble' : lm.group_id ? 'group' : 'element';
        const locName = lm.location_ensembles?.name || lm.location_groups?.name || lm.location_elements?.name || '—';
        allMembers.push({
          id: lm.id,
          user_id: lm.user_id,
          role_code: (lm.roles as Record<string, unknown>)?.code as string || '?',
          role_label: ((lm.roles as Record<string, unknown>)?.label as Record<string, string>)?.fr || (lm.roles as Record<string, unknown>)?.code as string || '?',
          is_active: lm.is_active,
          expires_at: lm.expires_at,
          created_at: lm.created_at,
          organization_name: null,
          user_name: null,
          source: 'location_membership',
          location_type: locType,
          location_name: locName,
        });
      });

      setMembers(allMembers);

      // Fetch roles via service
      const rolesData = await fetchRolesService();
      setRoles(rolesData as unknown as Role[]);

      // Fetch locations via service
      const [ensData, grpData, elmData] = await Promise.all([
        fetchEnsemblesWithRelations(selectedOrganization.id),
        fetchGroupsByOrganization(selectedOrganization.id),
        fetchElementsByOrganization(selectedOrganization.id),
      ]);
      const locs: LocationOption[] = [
        ...(ensData || []).map((e: { id: string; name: string }) => ({ id: e.id, name: e.name, type: 'ensemble' as const })),
        ...(grpData || []).map((g: { id: string; name: string }) => ({ id: g.id, name: g.name, type: 'group' as const })),
        ...(elmData || []).map((el: { id: string; name: string }) => ({ id: el.id, name: el.name, type: 'element' as const })),
      ];
      setLocations(locs);

      // Fetch audit logs — TODO: migrate to service layer
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .in('entity', ['membership', 'location_membership'])
        .order('created_at', { ascending: false })
        .limit(50);
      setAuditLogs(logs || []);

    } catch (err) {
      log.error('Error fetching access data', { error: err });
      toast.error('Erreur lors du chargement des accès');
    } finally {
      setLoading(false);
    }
  }, [selectedOrganization]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getExpirationStatus = (expiresAt: string | null, isActive: boolean) => {
    if (!isActive) return 'inactive';
    if (!expiresAt) return 'permanent';
    const date = new Date(expiresAt);
    if (isPast(date)) return 'expired';
    const daysLeft = differenceInDays(date, new Date());
    if (daysLeft <= 7) return 'expiring';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'permanent': return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"><CheckCircle2 className="h-3 w-3 mr-1" />Permanent</Badge>;
      case 'active': return <Badge className="bg-sky-500/15 text-sky-700 border-sky-200 dark:text-sky-400 dark:border-sky-800"><Clock className="h-3 w-3 mr-1" />Actif</Badge>;
      case 'expiring': return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800"><AlertTriangle className="h-3 w-3 mr-1" />Expire bientôt</Badge>;
      case 'expired': return <Badge className="bg-red-500/15 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800"><XCircle className="h-3 w-3 mr-1" />Expiré</Badge>;
      case 'inactive': return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Inactif</Badge>;
      default: return null;
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = !searchTerm || 
      m.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const status = getExpirationStatus(m.expires_at, m.is_active);
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return status === 'permanent' || status === 'active';
    if (filterStatus === 'expired') return status === 'expired' || status === 'inactive';
    if (filterStatus === 'expiring') return status === 'expiring';
    return true;
  });

  const stats = {
    total: members.length,
    active: members.filter(m => m.is_active).length,
    expiring: members.filter(m => getExpirationStatus(m.expires_at, m.is_active) === 'expiring').length,
    expired: members.filter(m => getExpirationStatus(m.expires_at, m.is_active) === 'expired').length,
  };

  const handleAddIntervenant = async () => {
    if (!selectedOrganization || !addForm.roleId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // For now, we need a user_id. In a real flow, we'd look up by email or invite.
      // This simplified version creates the membership directly.
      if (addForm.scopeType === 'organization') {
        await createMembership({
          user_id: '',
          role_id: addForm.roleId,
          organization_id: selectedOrganization.id,
        });
      } else {
        await createLocationMembership({
          user_id: '',
          role_id: addForm.roleId,
          organization_id: selectedOrganization.id,
          ensemble_id: addForm.scopeType === 'ensemble' ? addForm.locationId : null,
          group_id: addForm.scopeType === 'group' ? addForm.locationId : null,
          element_id: addForm.scopeType === 'element' ? addForm.locationId : null,
        });
      }

      toast.success('Intervenant ajouté avec succès');
      setIsAddDialogOpen(false);
      setAddForm({ email: '', roleId: '', scopeType: 'organization', locationId: '', expiresAt: null });
      fetchData();
    } catch (err: unknown) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Erreur'}`);
      log.error('Error adding intervenant', { error: err });
    }
  };

  // TODO: migrer toggleAccess vers service admin
  const toggleAccess = async (member: MemberAccess) => {
    try {
      const table = member.source === 'membership' ? 'memberships' : 'location_memberships';
      const { error } = await supabase
        .from(table)
        .update({ is_active: !member.is_active })
        .eq('id', member.id);
      if (error) throw error;
      toast.success(member.is_active ? 'Accès révoqué' : 'Accès réactivé');
      fetchData();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const selectedRole = roles.find(r => r.id === addForm.roleId);
  const isTemporal = selectedRole && TEMPORAL_ROLES.includes(selectedRole.code);
  const filteredLocations = locations.filter(l => l.type === addForm.scopeType);

  if (!selectedOrganization) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
          Sélectionnez une organisation pour gérer les accès
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Accès & Sécurité
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Contrôle des accès pour <span className="font-medium text-foreground">{selectedOrganization.name}</span>
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Ajouter un intervenant
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Actifs</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Expirent bientôt</p>
                <p className="text-2xl font-bold text-amber-600">{stats.expiring}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Expirés</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="members" className="gap-2"><Users className="h-4 w-4" />Membres</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><Activity className="h-4 w-4" />Journal d'audit</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, rôle ou lieu..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'active', 'expiring', 'expired'] as const).map(f => (
                <Button
                  key={f}
                  variant={filterStatus === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(f)}
                  className="text-xs"
                >
                  {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : f === 'expiring' ? 'Bientôt' : 'Expirés'}
                </Button>
              ))}
            </div>
          </div>

          {/* Members table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Chargement...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  Aucun accès trouvé
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Utilisateur</TableHead>
                      <TableHead className="font-semibold">Rôle</TableHead>
                      <TableHead className="font-semibold">Périmètre</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Expiration</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map(m => {
                      const status = getExpirationStatus(m.expires_at, m.is_active);
                      return (
                        <TableRow key={`${m.source}-${m.id}`} className={cn(
                          status === 'expired' && 'opacity-60',
                          status === 'expiring' && 'bg-amber-500/5'
                        )}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                                {m.user_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{m.user_name || 'Utilisateur'}</p>
                                <p className="text-xs text-muted-foreground font-mono">{m.user_id.slice(0, 8)}…</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {m.role_label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {m.source === 'membership' ? (
                              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                                Organisation
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-sm">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground capitalize">{m.location_type}</span>
                                <span className="font-medium">{m.location_name}</span>
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(status)}</TableCell>
                          <TableCell>
                            {m.expires_at ? (
                              <div className="flex items-center gap-1.5 text-sm">
                                <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className={cn(
                                  status === 'expired' && 'text-red-600 line-through',
                                  status === 'expiring' && 'text-amber-600 font-medium'
                                )}>
                                  {format(new Date(m.expires_at), 'dd MMM yyyy', { locale: fr })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={m.is_active ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => toggleAccess(m)}
                              className="text-xs"
                            >
                              {m.is_active ? 'Révoquer' : 'Réactiver'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Journal d'audit des accès
              </CardTitle>
              <CardDescription>Traçabilité complète des modifications d'accès</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun événement enregistré</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                      <div className={cn(
                        "mt-0.5 p-1.5 rounded-full",
                        log.action === 'membership_created' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                        log.action === 'membership_updated' && 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
                        log.action === 'membership_deleted' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                        log.action === 'auto_expired' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
                      )}>
                        {log.action === 'membership_created' ? <UserPlus className="h-3.5 w-3.5" /> :
                         log.action === 'auto_expired' ? <Clock className="h-3.5 w-3.5" /> :
                         <Eye className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {log.action === 'membership_created' ? 'Accès créé' :
                           log.action === 'membership_updated' ? 'Accès modifié' :
                           log.action === 'membership_deleted' ? 'Accès supprimé' :
                           log.action === 'auto_expired' ? 'Expiré automatiquement' :
                           log.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.entity} · {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Ajouter un intervenant
            </DialogTitle>
            <DialogDescription>
              Attribuez un rôle avec un périmètre et une durée précis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Email */}
            <div className="space-y-2">
              <Label>Email de l'utilisateur</Label>
              <Input
                type="email"
                placeholder="intervenant@example.com"
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={addForm.roleId} onValueChange={v => setAddForm(f => ({ ...f, roleId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex items-center gap-2">
                        {(r.label as any)?.fr || r.code}
                        {TEMPORAL_ROLES.includes(r.code) && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">temporaire</Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole?.description && (
                <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
              )}
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label>Périmètre d'accès</Label>
              <Select value={addForm.scopeType} onValueChange={(v: 'organization' | 'ensemble' | 'group' | 'element') => setAddForm(f => ({ ...f, scopeType: v, locationId: '' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">🏢 Organisation entière</SelectItem>
                  <SelectItem value="ensemble">🏘️ Copropriété (Ensemble)</SelectItem>
                  <SelectItem value="group">🏗️ Bâtiment (Groupement)</SelectItem>
                  <SelectItem value="element">🏠 Lot (Élément)</SelectItem>
                </SelectContent>
              </Select>

              {addForm.scopeType !== 'organization' && (
                <Select value={addForm.locationId} onValueChange={v => setAddForm(f => ({ ...f, locationId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLocations.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Date d'expiration
                {isTemporal && <Badge variant="secondary" className="text-[10px]">Obligatoire</Badge>}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !addForm.expiresAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {addForm.expiresAt ? format(addForm.expiresAt, 'PPP', { locale: fr }) : "Accès permanent"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={addForm.expiresAt || undefined}
                    onSelect={d => setAddForm(f => ({ ...f, expiresAt: d || null }))}
                    disabled={date => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {isTemporal && !addForm.expiresAt && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Ce rôle nécessite une date d'expiration
                </p>
              )}
            </div>

            <Button
              onClick={handleAddIntervenant}
              className="w-full"
              disabled={!addForm.roleId || (isTemporal && !addForm.expiresAt)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Attribuer l'accès
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
