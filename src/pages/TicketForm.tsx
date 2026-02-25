import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { closeCurrentView } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, QrCode, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildTicketTitle, TICKET_PRIORITIES, TICKET_STATUSES } from '@/utils/ticketUtils';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';
import { MediaUpload, UploadedFile } from '@/components/tickets/MediaUpload';

export function TicketForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [qrCode, setQrCode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as keyof typeof TICKET_PRIORITIES,
    action: '',
    category: '',
    object: '',
    initiality: 'initial' as 'initial' | 'relance',
    contact_name: '',
    contact_email: '',
    contact_phone: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const loadQRCode = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('qr_codes')
          .select('*, location_elements(name), location_groups(name), location_ensembles(name)')
          .eq('target_slug', slug)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          toast({
            title: 'QR Code non trouvé',
            description: 'Ce QR Code n\'existe pas ou n\'est plus actif',
            variant: 'destructive'
          });
          return;
        }

        setQrCode(data);
        
        // Pré-remplir avec la configuration du formulaire
        if (data.form_config && typeof data.form_config === 'object' && data.form_config !== null) {
          const config = data.form_config as { action?: string; category?: string; object?: string };
          setFormData(prev => ({
            ...prev,
            action: config.action || '',
            category: config.category || '',
            object: config.object || ''
          }));
        }
      } catch (err) {
        console.error('Error loading QR code:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations du QR Code',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadQRCode();
  }, [slug, toast]);

  // Mettre à jour le titre automatiquement
  useEffect(() => {
    if (formData.action && formData.category && formData.object) {
      const title = buildTicketTitle({
        initiality: formData.initiality,
        action: formData.action,
        category: formData.category,
        object: formData.object
      });
      setFormData(prev => ({ ...prev, title }));
    }
  }, [formData.action, formData.category, formData.object, formData.initiality]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      // Get user if logged in (optional - QR tickets can be anonymous)
      const { data: userData } = await supabase.auth.getUser();
      
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open' as const,
        created_by: userData?.user?.id || null,
        building_id: qrCode?.building_id || null,
        source: 'qr_code',
        category_code: formData.category || null,
        nature_code: formData.action || null,
        reporter_name: formData.contact_name || null,
        reporter_email: formData.contact_email || null,
        reporter_phone: formData.contact_phone || null,
        location: {
          type: qrCode?.location_element_id ? 'element' : 
                qrCode?.location_group_id ? 'group' : 
                qrCode?.location_ensemble_id ? 'ensemble' : null,
          element_id: qrCode?.location_element_id || null,
          group_id: qrCode?.location_group_id || null,
          ensemble_id: qrCode?.location_ensemble_id || null,
          name: qrCode?.location_elements?.name || qrCode?.location_groups?.name || qrCode?.location_ensembles?.name || null
        },
        attachments: uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type, storage_path: f.storagePath })),
        meta: {
          qr_code_id: qrCode?.id,
          organization_id: qrCode?.organization_id,
          initiality: formData.initiality,
          object: formData.object
        }
      };

      const { error } = await supabase
        .from('tickets')
        .insert(ticketData);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Ticket créé',
        description: 'Votre signalement a été enregistré avec succès'
      });
      
    } catch (err) {
      console.error('Error creating ticket:', err);

      // Supabase peut renvoyer un objet d'erreur (PostgrestError) qui n'est pas une instance d'Error
      const anyErr = err as any;
      const message =
        (anyErr?.message as string | undefined) ||
        (err instanceof Error ? err.message : undefined) ||
        'Impossible de créer le ticket';
      const details = (anyErr?.details as string | undefined) || (anyErr?.hint as string | undefined);
      const code = (anyErr?.code as string | undefined);

      toast({
        title: 'Erreur',
        description: [message, code ? `Code: ${code}` : null, details ? `Détails: ${details}` : null]
          .filter(Boolean)
          .join(' — '),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">QR Code invalide</h3>
              <p className="text-muted-foreground">
                Ce QR Code n'existe pas ou n'est plus actif.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ticket créé !</h3>
              <p className="text-muted-foreground mb-4">
                Votre signalement a été enregistré avec succès.
              </p>
              <Button onClick={() => closeCurrentView(navigate)} className="min-h-[44px] active:scale-95 transition-transform">
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const locationName = qrCode?.location_elements?.name || 
                      qrCode?.location_groups?.name || 
                      qrCode?.location_ensembles?.name || 
                      'Non défini';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Signalement</h1>
              <p className="text-muted-foreground">{qrCode?.display_label}</p>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Lieu :</strong> {locationName}
            </AlertDescription>
          </Alert>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <TicketFormStep title="Informations du signalement">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select 
                  value={formData.action} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, action: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signaler">Signaler</SelectItem>
                    <SelectItem value="demander">Demander</SelectItem>
                    <SelectItem value="informer">Informer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="nettoyage">Nettoyage</SelectItem>
                    <SelectItem value="securite">Sécurité</SelectItem>
                    <SelectItem value="technique">Technique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="object">Objet</Label>
                <Select 
                  value={formData.object} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, object: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un objet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eclairage">Éclairage</SelectItem>
                    <SelectItem value="chauffage">Chauffage</SelectItem>
                    <SelectItem value="ascenseur">Ascenseur</SelectItem>
                    <SelectItem value="porte">Porte</SelectItem>
                    <SelectItem value="fenetre">Fenêtre</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.title && (
              <div className="space-y-2">
                <Label>Titre généré automatiquement</Label>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm">{formData.title}</code>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as keyof typeof TICKET_PRIORITIES }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_PRIORITIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez le problème ou la demande en détail..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Pièces jointes (photo, audio, vidéo)</Label>
              <MediaUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
            </div>
          </TicketFormStep>

          <TicketFormStep title="Vos coordonnées (optionnel)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nom</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="Votre nom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="votre.email@exemple.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Téléphone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="06 12 34 56 78"
              />
            </div>
          </TicketFormStep>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => closeCurrentView(navigate)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.title || !formData.description}
            >
              {submitting ? 'Création...' : 'Créer le ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}