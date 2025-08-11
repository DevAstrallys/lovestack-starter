import React, { useState, useEffect } from 'react';
import { LocationTag, LocationElement } from './LocationsManagement';
import { TagSelector } from './TagSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, QrCode, Search, Filter } from 'lucide-react';

interface LocationElementsProps {
  organizationId: string;
}

export const LocationElements: React.FC<LocationElementsProps> = ({ organizationId }) => {
  const [elements, setElements] = useState<LocationElement[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<LocationElement | null>(null);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [lastCreatedElement, setLastCreatedElement] = useState<{name: string, addressData: any} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'France',
    qrLocation: '',
    selectedTags: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      fetchElements();
      fetchAvailableTags();
    }
  }, [organizationId]);

  const fetchElements = async () => {
    try {
      const { data, error } = await supabase
        .from('location_elements' as any)
        .select(`
          *,
          location_element_tags (
            location_tags (*)
          )
        `)
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;

      const elementsWithTags = (data || []).map((element: any) => ({
        ...element,
        tags: element.location_element_tags?.map((et: any) => et.location_tags) || []
      }));

      setElements(elementsWithTags);
    } catch (error) {
      console.error('Error fetching elements:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les éléments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from('location_tags' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setAvailableTags((data as any) || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSave = async () => {
    try {
      const locationData = {
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        country: formData.country,
        qrLocation: formData.qrLocation
      };

      const elementData = {
        name: formData.name,
        description: formData.description || null,
        location_data: Object.values(locationData).some(v => v.trim()) ? locationData : null,
        organization_id: organizationId
      };

      let elementId: string;

      if (editingElement) {
        const { error } = await supabase
          .from('location_elements' as any)
          .update(elementData)
          .eq('id', editingElement.id);

        if (error) throw error;
        elementId = editingElement.id;
      } else {
        const { data, error } = await supabase
          .from('location_elements' as any)
          .insert(elementData)
          .select()
          .single();

        if (error) throw error;
        elementId = (data as any).id;
      }

      // Update tags
      await supabase
        .from('location_element_tags' as any)
        .delete()
        .eq('element_id', elementId);

      if (formData.selectedTags.length > 0) {
        const tagInserts = formData.selectedTags.map(tagId => ({
          element_id: elementId,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('location_element_tags' as any)
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      // Générer automatiquement le QR code pour les nouveaux éléments
      if (!editingElement) {
        try {
          const qrData = {
            location_element_id: elementId,
            display_label: `QR Code - ${formData.name}`,
            target_slug: `element/${elementId}`,
            location: {
              description: formData.qrLocation || 'Localisation non spécifiée'
            },
            is_active: true
          };

          await supabase
            .from('qr_codes' as any)
            .insert(qrData);
        } catch (qrError) {
          console.error('Error auto-generating QR code:', qrError);
        }
      }

      toast({
        title: "Succès",
        description: editingElement ? "Élément modifié" : "Élément créé avec QR code généré",
      });

      setDialogOpen(false);
      
      // Pour les nouveaux éléments, proposer de créer d'autres éléments à la même adresse
      if (!editingElement) {
        setLastCreatedElement({
          name: formData.name,
          addressData: {
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            country: formData.country,
            qrLocation: formData.qrLocation
          }
        });
        setConfirmationDialogOpen(true);
      }
      
      resetForm();
      fetchElements();
    } catch (error) {
      console.error('Error saving element:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'élément",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (element: LocationElement) => {
    setEditingElement(element);
    const locationData = element.location_data as any;
    setFormData({
      name: element.name,
      description: element.description || '',
      address: locationData?.address || '',
      city: locationData?.city || '',
      zipCode: locationData?.zipCode || '',
      country: locationData?.country || 'France',
      qrLocation: locationData?.qrLocation || '',
      selectedTags: element.tags?.map(tag => tag.id) || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (elementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      const { error } = await supabase
        .from('location_elements' as any)
        .delete()
        .eq('id', elementId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Élément supprimé",
      });

      fetchElements();
    } catch (error) {
      console.error('Error deleting element:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élément",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      zipCode: '',
      country: 'France',
      qrLocation: '',
      selectedTags: []
    });
    setEditingElement(null);
  };

  const handleCreateAnotherElement = () => {
    if (lastCreatedElement) {
      setFormData(prev => ({
        ...prev,
        ...lastCreatedElement.addressData,
        name: '',
        description: '',
        selectedTags: []
      }));
      setConfirmationDialogOpen(false);
      setDialogOpen(true);
      setLastCreatedElement(null);
    }
  };

  const handleFinishCreating = () => {
    setConfirmationDialogOpen(false);
    setLastCreatedElement(null);
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const handleCreateTag = async (name: string, color: string) => {
    try {
      const { data, error } = await supabase
        .from('location_tags' as any)
        .insert({
          name,
          color,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw error;

      const newTag: LocationTag = {
        id: (data as any).id,
        name: (data as any).name,
        color: (data as any).color,
        organization_id: (data as any).organization_id,
        created_at: (data as any).created_at
      };

      setAvailableTags(prev => [...prev, newTag]);
      
      toast({
        title: "Succès",
        description: "Tag créé avec succès",
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le tag",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQRCode = async (elementId: string, elementName: string) => {
    try {
      const element = elements.find(e => e.id === elementId);
      const locationData = element?.location_data as any;
      
      const qrData = {
        location_element_id: elementId,
        display_label: `QR Code - ${elementName}`,
        target_slug: `element/${elementId}`,
        location: {
          description: locationData?.qrLocation || 'Localisation non spécifiée'
        },
        is_active: true
      };

      const { data, error } = await supabase
        .from('qr_codes' as any)
        .insert(qrData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: `QR Code généré pour ${elementName}`,
      });

      // Optionnel: ouvrir une nouvelle fenêtre avec le QR code
      const qrUrl = `${window.location.origin}/qr/${(data as any).id}`;
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`, '_blank');
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le QR code",
        variant: "destructive",
      });
    }
  };

  // Filtrage intelligent des éléments
  const filteredElements = elements.filter(element => {
    const matchesSearch = searchTerm === '' || 
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = selectedTagFilter === '' || 
      element.tags?.some(tag => tag.id === selectedTagFilter);
    
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return <div className="text-center py-4">Chargement des éléments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Éléments de Lieu</h3>
          <p className="text-sm text-muted-foreground">
            Les éléments sont les unités de base de votre hiérarchie de lieux
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: 'cards' | 'table') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Tableau</SelectItem>
              <SelectItem value="cards">Cartes</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingElement ? 'Modifier l\'élément' : 'Créer un élément'}
              </DialogTitle>
              <DialogDescription>
                Définissez les propriétés de l'élément de lieu
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de l'élément"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description optionnelle"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 rue de la République"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Code postal</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="75001"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="France"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="qrLocation">Localisation du QR Code</Label>
                <Input
                  id="qrLocation"
                  value={formData.qrLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, qrLocation: e.target.value }))}
                  placeholder="Entrée principale, Étage 2, Salle A..."
                />
              </div>
              <TagSelector
                availableTags={availableTags}
                selectedTags={formData.selectedTags}
                onTagToggle={toggleTag}
                onTagCreate={handleCreateTag}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={!formData.name.trim()}>
                  {editingElement ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par nom, description ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedTagFilter} onValueChange={setSelectedTagFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les tags</SelectItem>
              {availableTags.map(tag => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vue tableau */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>QR Location</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredElements.map((element) => {
                  const locationData = element.location_data as any;
                  const address = [
                    locationData?.address,
                    locationData?.zipCode && locationData?.city ? `${locationData.zipCode} ${locationData.city}` : locationData?.city || locationData?.zipCode,
                    locationData?.country && locationData.country !== 'France' ? locationData.country : null
                  ].filter(Boolean).join(', ');

                  return (
                    <TableRow key={element.id}>
                      <TableCell className="font-medium">{element.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{element.description || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{address || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {element.tags?.slice(0, 2).map(tag => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {element.tags && element.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{element.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {locationData?.qrLocation || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(element.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(element)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateQRCode(element.id, element.name)}
                            title="Générer QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(element.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Vue cartes */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredElements.map((element) => (
          <Card key={element.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{element.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(element)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateQRCode(element.id, element.name)}
                    title="Générer QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(element.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {element.description && (
                <CardDescription className="text-xs">
                  {element.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  const locationData = element.location_data as any;
                  const hasAddress = locationData?.address || locationData?.city || locationData?.zipCode;
                  
                  return hasAddress && (
                    <div className="text-xs text-muted-foreground">
                      {locationData?.address && (
                        <div>{locationData.address}</div>
                      )}
                      {(locationData?.zipCode || locationData?.city) && (
                        <div>
                          {locationData?.zipCode && `${locationData.zipCode} `}
                          {locationData?.city}
                          {locationData?.country && locationData.country !== 'France' && `, ${locationData.country}`}
                        </div>
                      )}
                      {locationData?.qrLocation && (
                        <div className="mt-1 text-primary">
                          📍 QR: {locationData.qrLocation}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {element.tags && element.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {element.tags.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Créé le {new Date(element.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Messages d'état */}
      {elements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun élément créé pour cette organisation.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouveau" pour créer votre premier élément.
            </p>
          </CardContent>
        </Card>
      ) : filteredElements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun élément ne correspond à vos critères de recherche.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Essayez de modifier votre recherche ou vos filtres.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Dialog de confirmation pour créer d'autres éléments à la même adresse */}
      <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Élément créé avec succès!</DialogTitle>
            <DialogDescription>
              L'élément "{lastCreatedElement?.name}" a été créé et son QR code a été généré automatiquement.
              <br />
              Souhaitez-vous créer d'autres éléments à la même adresse?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleFinishCreating}>
              Non, terminer
            </Button>
            <Button onClick={handleCreateAnotherElement}>
              Oui, créer un autre élément
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};