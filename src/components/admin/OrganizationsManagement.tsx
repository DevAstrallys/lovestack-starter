import React, { useState, useEffect } from 'react';
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
import { Building2, Plus, Edit, Users, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

export const OrganizationsManagement = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les organisations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingOrg) {
        // Update existing organization
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
        // Create new organization
        const { error } = await supabase
          .from('organizations')
          .insert({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            zip_code: formData.zip_code,
            city: formData.city,
            country: formData.country
          });

        if (error) throw error;
        
        toast({
          title: "Organisation créée",
          description: "La nouvelle organisation a été créée avec succès",
        });
      }

      setFormData({ name: '', description: '', address: '', zip_code: '', city: '', country: 'FR' });
      setEditingOrg(null);
      setIsDialogOpen(false);
      fetchOrganizations();
    } catch (error) {
      console.error('Error saving organization:', error);
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
      console.error('Error updating organization status:', error);
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
                  <TableHead>Adresse</TableHead>
                  <TableHead>Description</TableHead>
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
                        <div className="text-sm">
                          {org.address && (
                            <div>{org.address}</div>
                          )}
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
                        <span className="text-sm text-muted-foreground">
                          {org.description || 'Aucune description'}
                        </span>
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
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(org)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
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