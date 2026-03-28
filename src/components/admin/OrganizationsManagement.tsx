import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Edit, X, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin:organizations');

interface Organization {
  id: string;
  name: string;
  description?: string;
  address?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OrgWithAdmin extends Organization {
  admin_name?: string | null;
}

interface ProfileResult {
  id: string;
  full_name: string | null;
  email?: string;
}

export const OrganizationsManagement = () => {
  const [organizations, setOrganizations] = useState<OrgWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    zip_code: '',
    city: '',
    country: 'FR'
  });

  // Admin search state
  const [adminSearch, setAdminSearch] = useState('');
  const [adminResults, setAdminResults] = useState<ProfileResult[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<ProfileResult | null>(null);
  const [searchingAdmin, setSearchingAdmin] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const resultsRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Close results dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch admin names for each org
      const orgsWithAdmin: OrgWithAdmin[] = [];
      for (const org of orgs || []) {
        const { data: membership } = await supabase
          .from('memberships')
          .select('user_id, roles!inner(code)')
          .eq('organization_id', org.id)
          .eq('is_active', true)
          .like('roles.code', '%admin%')
          .limit(1);

        let adminName: string | null = null;
        if (membership && membership.length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', membership[0].user_id)
            .single();
          adminName = profile?.full_name || null;
        }
        orgsWithAdmin.push({ ...org, admin_name: adminName });
      }

      setOrganizations(orgsWithAdmin);
    } catch (error) {
      log.error('Error fetching organizations', { error });
      toast({
        title: "Erreur",
        description: "Impossible de charger les organisations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setAdminResults([]);
      setShowResults(false);
      return;
    }
    setSearchingAdmin(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setAdminResults(data || []);
      setShowResults(true);
    } catch (err) {
      log.error('Error searching users', { error: err });
    } finally {
      setSearchingAdmin(false);
    }
  }, []);

  const handleAdminSearchChange = (value: string) => {
    setAdminSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(value), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingOrg) {
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            zip_code: formData.zip_code,
            city: formData.city,
            country: formData.country,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOrg.id);

        if (error) throw error;
        
        toast({
          title: "Organisation mise à jour",
          description: "L'organisation a été mise à jour avec succès",
        });
      } else {
        const { data: newOrg, error } = await supabase
          .from('organizations')
          .insert({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            zip_code: formData.zip_code,
            city: formData.city,
            country: formData.country
          })
          .select()
          .single();

        if (error) throw error;

        // Assign admin if selected
        if (selectedAdmin && newOrg) {
          try {
            // Find admin_org role
            let { data: role } = await supabase
              .from('roles')
              .select('id')
              .eq('code', 'admin_org')
              .single();

            if (!role) {
              const { data: fallback } = await supabase
                .from('roles')
                .select('id')
                .eq('is_platform_scope', false)
                .ilike('code', '%admin%')
                .limit(1);
              role = fallback?.[0] || null;
            }

            if (role) {
              const { error: memberError } = await supabase
                .from('memberships')
                .insert({
                  user_id: selectedAdmin.id,
                  organization_id: newOrg.id,
                  role_id: role.id,
                  is_active: true
                });

              if (memberError) {
                log.error('Failed to create admin membership', { error: memberError });
                toast({
                  title: "Attention",
                  description: "Organisation créée mais l'attribution du rôle admin a échoué",
                  variant: "destructive",
                });
              }
            }
          } catch (adminErr) {
            log.error('Error assigning admin', { error: adminErr });
          }
        }
        
        toast({
          title: "Organisation créée",
          description: "La nouvelle organisation a été créée avec succès",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchOrganizations();
    } catch (error) {
      log.error('Error saving organization', { error });
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'organisation",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      description: org.description || '',
      address: org.address || '',
      zip_code: org.zip_code || '',
      city: org.city || '',
      country: org.country || 'FR'
    });
    setSelectedAdmin(null);
    setAdminSearch('');
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (org: Organization) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          is_active: !org.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', org.id);

      if (error) throw error;
      
      toast({
        title: "Statut mis à jour",
        description: `L'organisation a été ${!org.is_active ? 'activée' : 'désactivée'}`,
      });
      
      fetchOrganizations();
    } catch (error) {
      log.error('Error updating organization status', { error });
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', address: '', zip_code: '', city: '', country: 'FR' });
    setEditingOrg(null);
    setSelectedAdmin(null);
    setAdminSearch('');
    setAdminResults([]);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement des organisations...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Gestion des Organisations</span>
              </CardTitle>
              <CardDescription>
                Créez et gérez les organisations (clients) de la plateforme
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nouvelle Organisation</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingOrg ? 'Modifier l\'organisation' : 'Nouvelle organisation'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrg 
                      ? 'Modifiez les informations de l\'organisation'
                      : 'Créez une nouvelle organisation pour vos clients'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom de l'organisation *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Entreprise ABC"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description de l'organisation..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 rue de l'exemple"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zip_code">Code postal</Label>
                        <Input
                          id="zip_code"
                          value={formData.zip_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                          placeholder="75001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Paris"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="FR"
                      />
                    </div>

                    {/* Admin search - only on creation */}
                    {!editingOrg && (
                      <div className="space-y-2" ref={resultsRef}>
                        <Label>Administrateur de l'organisation (optionnel)</Label>
                        {selectedAdmin ? (
                          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                            <span className="text-sm flex-1">{selectedAdmin.full_name || 'Sans nom'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAdmin(null);
                                setAdminSearch('');
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={adminSearch}
                              onChange={(e) => handleAdminSearchChange(e.target.value)}
                              placeholder="Rechercher par nom..."
                              className="pl-9"
                            />
                            {showResults && adminResults.length > 0 && (
                              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                                {adminResults.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => {
                                      setSelectedAdmin(p);
                                      setAdminSearch('');
                                      setShowResults(false);
                                    }}
                                  >
                                    {p.full_name || 'Sans nom'}
                                  </button>
                                ))}
                              </div>
                            )}
                            {showResults && adminSearch.length >= 2 && adminResults.length === 0 && !searchingAdmin && (
                              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md px-3 py-2 text-sm text-muted-foreground">
                                Aucun utilisateur trouvé
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingOrg ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Administrateur</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune organisation trouvée. Créez votre première organisation.
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{org.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {org.admin_name || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {org.address && <div>{org.address}</div>}
                          {(org.zip_code || org.city) && (
                            <div className="text-muted-foreground">
                              {org.zip_code} {org.city}
                            </div>
                          )}
                          {!org.address && !org.zip_code && !org.city && (
                            <span className="text-muted-foreground">Aucune adresse</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={org.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleStatus(org)}
                        >
                          {org.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(org.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(org)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
