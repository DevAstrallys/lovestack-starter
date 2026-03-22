import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Plus, FileText, Download, Settings } from 'lucide-react';
import { openInternalRoute } from '@/lib/navigation';
import { createLogger } from '@/lib/logger';
import { createQRCode, fetchQRCodesForOrganization } from '@/services/locations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeTemplates } from './QRCodeTemplates';
import { QRCodeFormConfig } from './QRCodeFormConfig';
import { LocationElement, LocationGroup, LocationEnsemble } from './LocationsManagement';

const log = createLogger('component:QRCodeLocationManager');

interface QRCodeLocationManagerProps {
  organizationId: string;
}

interface QRCodeWithLocation {
  id: string;
  display_label: string | null;
  target_slug: string | null;
  is_active: boolean;
  version: number;
  last_regenerated_at: string;
  created_at: string;
  location_element_id: string | null;
  location_type: 'element' | 'group' | 'ensemble' | null;
  location_name: string | null;
}

export function QRCodeLocationManager({ organizationId }: QRCodeLocationManagerProps) {
  const [qrCodes, setQRCodes] = useState<QRCodeWithLocation[]>([]);
  const [elements, setElements] = useState<LocationElement[]>([]);
  const [groups, setGroups] = useState<LocationGroup[]>([]);
  const [ensembles, setEnsembles] = useState<LocationEnsemble[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [configQRCode, setConfigQRCode] = useState<QRCodeWithLocation | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [templateQRCodeId, setTemplateQRCodeId] = useState<string | null>(null);
  
  const [newQRData, setNewQRData] = useState({
    display_label: '',
    location_type: '' as 'element' | 'group' | 'ensemble' | '',
    location_id: '',
    template_id: 'default'
  });

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les éléments, groupes et ensembles
      const [elementsRes, groupsRes, ensemblesRes] = await Promise.all([
        supabase.from('location_elements').select('*').eq('organization_id', organizationId),
        supabase.from('location_groups').select('*').eq('organization_id', organizationId),
        supabase.from('location_ensembles').select('*').eq('organization_id', organizationId)
      ]);

      if (elementsRes.error) throw elementsRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (ensemblesRes.error) throw ensemblesRes.error;

      setElements(elementsRes.data || []);
      setGroups(groupsRes.data || []);
      setEnsembles(ensemblesRes.data || []);

      // Charger les QR codes avec les informations de localisation
      await loadQRCodes(elementsRes.data, groupsRes.data, ensemblesRes.data);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQRCodes = async (elements: LocationElement[], groups: LocationGroup[], ensembles: LocationEnsemble[]) => {
    try {
      // Récupérer tous les QR codes liés aux éléments de l'organisation
      const elementIds = elements.map(e => e.id);
      const groupIds = groups.map(g => g.id);  
      const ensembleIds = ensembles.map(e => e.id);
      
      const { data: qrData, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          location_elements(name),
          location_groups(name),
          location_ensembles(name)
        `)
        .or(`location_element_id.in.(${elementIds.join(',')}),location_group_id.in.(${groupIds.join(',')}),location_ensemble_id.in.(${ensembleIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir les QR codes avec les informations de localisation
      const enrichedQRCodes: QRCodeWithLocation[] = (qrData || []).map(qr => {
        let location_type: 'element' | 'group' | 'ensemble' | null = null;
        let location_name: string | null = null;

        if (qr.location_element_id) {
          const element = elements.find(e => e.id === qr.location_element_id);
          if (element) {
            location_type = 'element';
            location_name = element.name;
          }
        } else if (qr.location_group_id) {
          const group = groups.find(g => g.id === qr.location_group_id);
          if (group) {
            location_type = 'group';
            location_name = group.name;
          }
        } else if (qr.location_ensemble_id) {
          const ensemble = ensembles.find(e => e.id === qr.location_ensemble_id);
          if (ensemble) {
            location_type = 'ensemble';
            location_name = ensemble.name;
          }
        }

        return {
          ...qr,
          location_type,
          location_name
        };
      });

      setQRCodes(enrichedQRCodes);
    } catch (error) {
      console.error('Error loading QR codes:', error);
    }
  };

  const handleCreateQR = async () => {
    try {
      if (!newQRData.location_type || !newQRData.location_id) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un type et un lieu',
          variant: 'destructive'
        });
        return;
      }

      // Générer un slug unique
      const slug = `${newQRData.location_type}-${newQRData.location_id}-${Date.now()}`;
      
      // Désactiver les anciens QR codes pour ce lieu selon le type
      if (newQRData.location_type === 'element') {
        await supabase
          .from('qr_codes')
          .update({ is_active: false })
          .eq('location_element_id', newQRData.location_id)
          .eq('is_active', true);
      } else if (newQRData.location_type === 'group') {
        await supabase
          .from('qr_codes')
          .update({ is_active: false })
          .eq('location_group_id', newQRData.location_id)
          .eq('is_active', true);
      } else if (newQRData.location_type === 'ensemble') {
        await supabase
          .from('qr_codes')
          .update({ is_active: false })
          .eq('location_ensemble_id', newQRData.location_id)
          .eq('is_active', true);
      }

      // Créer le nouveau QR code
      const qrCodeData: any = {
        display_label: newQRData.display_label,
        target_slug: slug,
        version: 1,
        is_active: true,
        organization_id: organizationId,
        created_by: user?.id,
        last_regenerated_at: new Date().toISOString(),
        form_config: {
          action: '',
          category: '',
          object: '',
          title_template: '[{initiality}] - [{action}] - [{category}] - [{object}]'
        }
      };

      // Associer le QR code au bon type de lieu
      if (newQRData.location_type === 'element') {
        qrCodeData.location_element_id = newQRData.location_id;
      } else if (newQRData.location_type === 'group') {
        qrCodeData.location_group_id = newQRData.location_id;
      } else if (newQRData.location_type === 'ensemble') {
        qrCodeData.location_ensemble_id = newQRData.location_id;
      }

      const { error } = await supabase
        .from('qr_codes')
        .insert(qrCodeData);

      if (error) throw error;

      setIsCreateDialogOpen(false);
      setNewQRData({
        display_label: '',
        location_type: '',
        location_id: '',
        template_id: 'default'
      });

      await loadData();

      toast({
        title: 'QR Code créé',
        description: 'Le QR Code a été créé avec succès'
      });

    } catch (error) {
      console.error('Error creating QR code:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le QR Code',
        variant: 'destructive'
      });
    }
  };

  const getLocationOptions = () => {
    switch (newQRData.location_type) {
      case 'element':
        return elements.map(e => ({ value: e.id, label: e.name }));
      case 'group':
        return groups.map(g => ({ value: g.id, label: g.name }));
      case 'ensemble':
        return ensembles.map(e => ({ value: e.id, label: e.name }));
      default:
        return [];
    }
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Gestion des QR Codes
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Créez des QR codes pour vos lieux et générez des templates d'impression
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Créer un QR Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_label">Nom du QR Code</Label>
                    <Input
                      id="display_label"
                      value={newQRData.display_label}
                      onChange={(e) => setNewQRData(prev => ({ ...prev, display_label: e.target.value }))}
                      placeholder="Ex: Hall d'entrée - Signalement"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location_type">Type de lieu</Label>
                    <Select 
                      value={newQRData.location_type} 
                      onValueChange={(value: 'element' | 'group' | 'ensemble') => 
                        setNewQRData(prev => ({ ...prev, location_type: value, location_id: '' }))
                      }
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

                  {newQRData.location_type && (
                    <div className="space-y-2">
                      <Label htmlFor="location_id">Lieu</Label>
                      <Select 
                        value={newQRData.location_id} 
                        onValueChange={(value) => setNewQRData(prev => ({ ...prev, location_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le lieu" />
                        </SelectTrigger>
                        <SelectContent>
                          {getLocationOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateQR}>
                      Créer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Codes
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {qrCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun QR Code créé</p>
                  <p className="text-sm">Créez votre premier QR Code pour commencer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {qrCodes.map((qr) => (
                    <div key={qr.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <QrCode className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">{qr.display_label}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{qr.location_type}: {qr.location_name}</span>
                              <Badge variant={qr.is_active ? "default" : "secondary"}>
                                {qr.is_active ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Naviguer vers le formulaire de ticket pour ce QR code
                            openInternalRoute(`/ticket-form/${qr.target_slug}`);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Formulaire
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setTemplateQRCodeId(qr.id);
                            setActiveTab('templates');
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Template
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setConfigQRCode(qr)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <QRCodeTemplates 
            organizationId={organizationId} 
            qrCodes={qrCodes.map(qr => ({
              id: qr.id,
              display_label: qr.display_label,
              target_slug: qr.target_slug,
              is_active: qr.is_active,
              location_name: qr.location_name,
              location_type: qr.location_type
            }))}
            initialQRCodeId={templateQRCodeId}
          />
        </TabsContent>
      </Tabs>

      {configQRCode && (
        <QRCodeFormConfig
          qrCode={configQRCode}
          isOpen={!!configQRCode}
          onClose={() => setConfigQRCode(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}