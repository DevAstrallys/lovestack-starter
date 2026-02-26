import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { closeCurrentView } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, QrCode, ArrowLeft, ArrowRight, Send, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTaxonomy } from '@/hooks/useTaxonomy';
import { ReportStepProfile, ProfileData } from '@/components/report/ReportStepProfile';
import { SignaturePad } from '@/components/report/SignaturePad';
import { AdBanner } from '@/components/report/AdBanner';
import DOMPurify from 'dompurify';

const TOTAL_STEPS = 3;

type InitiativeType = 'initial' | 'relance';
type UploadType = 'image' | 'audio' | 'video';

interface UploadedFile {
  name: string;
  url: string;
  type: UploadType;
  storagePath: string;
}

interface DiagnosticState {
  action_id: string;
  action_key: string;
  action_label: string;
  initiality: InitiativeType;
  category_id: string;
  category_label: string;
  object_id: string;
  object_label: string;
  detail_id: string;
  detail_label: string;
  urgency: number;
}

interface MediaState {
  description: string;
  notification_channel: 'email' | 'sms' | 'none';
}

const URGENCY_LEVELS = [
  { value: 4, label: 'Personnes', dot: '🔴' },
  { value: 3, label: 'Immeuble', dot: '🟠' },
  { value: 2, label: 'Moyen', dot: '🟡' },
  { value: 1, label: 'Faible', dot: '🟢' },
] as const;

export function TicketForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [qrCode, setQrCode] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  const { actions, getFilteredCategories, getFilteredObjects, getFilteredDetails, loading: taxLoading } = useTaxonomy();

  const [profile, setProfile] = useState<ProfileData>({
    first_name: '', last_name: '', role: '', phone: '', email: '',
  });

  const [diagnostic, setDiagnostic] = useState<DiagnosticState>({
    action_id: '',
    action_key: '',
    action_label: '',
    initiality: 'initial',
    category_id: '',
    category_label: '',
    object_id: '',
    object_label: '',
    detail_id: '',
    detail_label: '',
    urgency: 2,
  });

  const [media, setMedia] = useState<MediaState>({ description: '', notification_channel: 'email' });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const uniqueActions = useMemo(() => {
    const seen = new Set<string>();
    return actions.filter((action) => {
      const key = (action.key || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [actions]);

  const filteredCategories = diagnostic.action_id ? getFilteredCategories(diagnostic.action_id) : [];
  const filteredObjects = diagnostic.category_id ? getFilteredObjects(diagnostic.category_id) : [];
  const filteredDetails = diagnostic.object_id ? getFilteredDetails(diagnostic.object_id) : [];

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('qr_codes_public')
          .select('*')
          .eq('target_slug', slug)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          toast({ title: 'QR Code non trouvé', description: 'Ce QR Code n\'existe pas ou n\'est plus actif', variant: 'destructive' });
          return;
        }

        let locationElementName: string | null = null;
        let locationGroupName: string | null = null;
        let locationEnsembleName: string | null = null;

        if (data.location_element_id) {
          const { data: el } = await supabase.from('location_elements').select('name').eq('id', data.location_element_id).single();
          locationElementName = el?.name || null;
        }
        if (data.location_group_id) {
          const { data: gr } = await supabase.from('location_groups').select('name').eq('id', data.location_group_id).single();
          locationGroupName = gr?.name || null;
        }
        if (data.location_ensemble_id) {
          const { data: en } = await supabase.from('location_ensembles').select('name').eq('id', data.location_ensemble_id).single();
          locationEnsembleName = en?.name || null;
        }

        setQrCode({
          ...data,
          location_elements: locationElementName ? { name: locationElementName } : null,
          location_groups: locationGroupName ? { name: locationGroupName } : null,
          location_ensembles: locationEnsembleName ? { name: locationEnsembleName } : null,
        });

        if (data.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('is_premium')
            .eq('id', data.organization_id)
            .single();
          setIsPremium(org?.is_premium ?? false);
        }

        if (data.form_config && typeof data.form_config === 'object' && data.form_config !== null) {
          const config = data.form_config as Record<string, string>;
          if (config.action) {
            const fromConfig = uniqueActions.find(a => a.key === config.action);
            if (fromConfig) {
              setDiagnostic(prev => ({
                ...prev,
                action_id: fromConfig.id,
                action_key: fromConfig.key,
                action_label: fromConfig.label,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error loading QR code:', err);
        toast({ title: 'Erreur', description: 'Impossible de charger les informations du QR Code', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, toast, uniqueActions]);

  useEffect(() => {
    const autoFill = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single();
        if (prof) {
          const parts = (prof.full_name || '').split(' ');
          setProfile(prev => ({
            ...prev,
            first_name: parts.slice(1).join(' ') || prev.first_name,
            last_name: parts[0] || prev.last_name,
            email: user.email || prev.email,
            phone: prof.phone || prev.phone,
          }));
        }
      }
    };

    autoFill();
  }, []);

  const buildTitle = () => {
    const init = diagnostic.initiality === 'relance' ? 'RELANCE' : 'INITIAL';
    const axis = diagnostic.action_key.toUpperCase();
    let title = `[${init}] [${axis}] ${diagnostic.category_label} > ${diagnostic.object_label}`;
    if (diagnostic.detail_label) title += ` : ${diagnostic.detail_label}`;
    return title;
  };

  const canProceed = () => {
    if (step === 1) return !!(profile.last_name && profile.first_name && profile.role);
    if (step === 2) return !!(diagnostic.action_id && diagnostic.initiality && diagnostic.category_id && diagnostic.object_id && diagnostic.urgency > 0);
    if (step === 3) {
      if (!media.description.trim()) return false;
      if (diagnostic.action_key === 'verifier' && !signatureDataUrl) return false;
      return true;
    }
    return false;
  };

  const uploadFile = async (file: File, type: UploadType) => {
    setUploading(true);
    try {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: 'Fichier trop volumineux', description: 'Maximum 20 Mo', variant: 'destructive' });
        return;
      }

      const ext = file.name.split('.').pop() || 'bin';
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('ticket-attachments')
        .upload(path, file, { contentType: file.type });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(path);

      setUploadedFiles(prev => ([
        ...prev,
        { name: file.name, url: urlData.publicUrl, type, storagePath: path },
      ]));
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Erreur d\'upload', description: 'Impossible d\'envoyer le fichier', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (type: UploadType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file, type);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    try {
      setSubmitting(true);
      const { data: userData } = await supabase.auth.getUser();

      const title = DOMPurify.sanitize(buildTitle());
      const description = DOMPurify.sanitize(media.description);
      const priority = diagnostic.urgency === 4 ? 'urgent' : diagnostic.urgency === 3 ? 'high' : diagnostic.urgency === 2 ? 'normal' : 'low';

      const ticketData: Record<string, unknown> = {
        title,
        description,
        priority,
        status: 'open',
        created_by: userData?.user?.id || null,
        building_id: qrCode?.building_id || null,
        organization_id: qrCode?.organization_id || null,
        source: 'qr_code',
        initiality: diagnostic.initiality,
        action_code: diagnostic.action_id || null,
        category_id: diagnostic.category_id || null,
        object_id: diagnostic.object_id || null,
        reporter_name: DOMPurify.sanitize(`${profile.last_name} ${profile.first_name}`.trim()),
        reporter_email: profile.email || null,
        reporter_phone: profile.phone || null,
        location: {
          type: qrCode?.location_element_id ? 'element' : qrCode?.location_group_id ? 'group' : qrCode?.location_ensemble_id ? 'ensemble' : null,
          element_id: qrCode?.location_element_id || null,
          group_id: qrCode?.location_group_id || null,
          ensemble_id: qrCode?.location_ensemble_id || null,
          name: qrCode?.location_elements?.name || qrCode?.location_groups?.name || qrCode?.location_ensembles?.name || null,
        },
        attachments: uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type, storage_path: f.storagePath })),
        meta: {
          qr_code_id: qrCode?.id,
          reporter_role: profile.role,
          detail_id: diagnostic.detail_id || null,
          detail_label: diagnostic.detail_label || null,
          urgency_level: diagnostic.urgency,
          notification_channel: media.notification_channel,
          signature: diagnostic.action_key === 'verifier' ? signatureDataUrl : null,
          action_id: diagnostic.action_id,
          action_key: diagnostic.action_key,
          action_label: diagnostic.action_label,
          category_label: diagnostic.category_label,
          object_label: diagnostic.object_label,
          organization_id: qrCode?.organization_id || null,
        },
      };

      console.log('[TicketForm] Payload submit', {
        action: { id: diagnostic.action_id, key: diagnostic.action_key, label: diagnostic.action_label },
        category: { id: diagnostic.category_id, label: diagnostic.category_label },
        object: { id: diagnostic.object_id, label: diagnostic.object_label },
        detail: { id: diagnostic.detail_id, label: diagnostic.detail_label },
        initiative: diagnostic.initiality,
        urgency: diagnostic.urgency,
        files: uploadedFiles,
        organization_id: qrCode?.organization_id || null,
        status: 'open',
        title,
      });

      const { error } = await supabase.from('tickets').insert(ticketData as any);
      if (error) throw error;

      setSubmitted(true);
      toast({ title: 'Ticket créé', description: 'Votre signalement a été enregistré avec succès' });
    } catch (err) {
      console.error('Error creating ticket:', err);
      const anyErr = err as any;
      toast({
        title: 'Erreur',
        description: anyErr?.message || 'Impossible de créer le ticket',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || taxLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">QR Code invalide</h3>
            <p className="text-muted-foreground">Ce QR Code n'existe pas ou n'est plus actif.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ticket créé !</h3>
            <p className="text-muted-foreground mb-4">Votre signalement a été enregistré avec succès.</p>
            <Button onClick={() => closeCurrentView(navigate)} className="min-h-[44px]">Fermer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const locationName = qrCode?.location_elements?.name || qrCode?.location_groups?.name || qrCode?.location_ensembles?.name || 'Non défini';

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="container mx-auto max-w-lg px-4 pt-6 space-y-4">
        {!isPremium && <AdBanner />}

        <div className="flex items-center gap-3">
          <QrCode className="h-7 w-7 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">Signalement</h1>
            <p className="text-sm text-muted-foreground truncate">{qrCode?.display_label}</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription><strong>Lieu :</strong> {locationName}</AlertDescription>
        </Alert>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Étape {step} / {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
        </div>

        {step === 1 && <ReportStepProfile data={profile} onChange={setProfile} />}

        {step === 2 && (
          <TicketFormStep title="Étape 2 — Diagnostic">
            <div className="space-y-2">
              <Label>Action (Axe) *</Label>
              <Select
                value={diagnostic.action_id}
                onValueChange={(value) => {
                  const selected = uniqueActions.find(a => a.id === value);
                  setDiagnostic(prev => ({
                    ...prev,
                    action_id: value,
                    action_key: selected?.key || '',
                    action_label: selected?.label || '',
                    category_id: '',
                    category_label: '',
                    object_id: '',
                    object_label: '',
                    detail_id: '',
                    detail_label: '',
                    urgency: 2,
                  }));
                }}
              >
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir une action" /></SelectTrigger>
                <SelectContent>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action.id} value={action.id}>{action.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {diagnostic.action_id && (
              <div className="space-y-2">
                <Label>Type d'initiative *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiagnostic(prev => ({ ...prev, initiality: 'initial' }))}
                    className={`rounded-md border px-3 py-2 text-sm ${diagnostic.initiality === 'initial' ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    Initial
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiagnostic(prev => ({ ...prev, initiality: 'relance' }))}
                    className={`rounded-md border px-3 py-2 text-sm ${diagnostic.initiality === 'relance' ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    Relance
                  </button>
                </div>
              </div>
            )}

            {diagnostic.action_id && (
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select
                  value={diagnostic.category_id}
                  onValueChange={(value) => {
                    const selected = filteredCategories.find(c => c.id === value);
                    setDiagnostic(prev => ({
                      ...prev,
                      category_id: value,
                      category_label: selected?.label || '',
                      object_id: '',
                      object_label: '',
                      detail_id: '',
                      detail_label: '',
                      urgency: 2,
                    }));
                  }}
                >
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {diagnostic.category_id && (
              <div className="space-y-2">
                <Label>Objet *</Label>
                <Select
                  value={diagnostic.object_id}
                  onValueChange={(value) => {
                    const selected = filteredObjects.find(o => o.id === value);
                    const defaultUrgency = selected && 'urgency_level' in selected && selected.urgency_level ? selected.urgency_level : diagnostic.urgency;
                    setDiagnostic(prev => ({
                      ...prev,
                      object_id: value,
                      object_label: selected?.label || '',
                      detail_id: '',
                      detail_label: '',
                      urgency: defaultUrgency,
                    }));
                  }}
                >
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir un objet" /></SelectTrigger>
                  <SelectContent>
                    {filteredObjects.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id}>{obj.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {diagnostic.object_id && filteredDetails.length > 0 && (
              <div className="space-y-2">
                <Label>Nature / Détail</Label>
                <Select
                  value={diagnostic.detail_id}
                  onValueChange={(value) => {
                    const selected = filteredDetails.find(d => d.id === value);
                    setDiagnostic(prev => ({
                      ...prev,
                      detail_id: value,
                      detail_label: selected?.label || '',
                    }));
                  }}
                >
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Préciser (optionnel)" /></SelectTrigger>
                  <SelectContent>
                    {filteredDetails.map((det) => (
                      <SelectItem key={det.id} value={det.id}>{det.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {diagnostic.object_id && (
              <div className="space-y-2">
                <Label>Urgence *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {URGENCY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setDiagnostic(prev => ({ ...prev, urgency: level.value }))}
                      className={`rounded-md border px-3 py-2 text-left text-sm ${diagnostic.urgency === level.value ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                      <span className="mr-2">{level.dot}</span>{level.value} - {level.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {diagnostic.action_id && diagnostic.category_id && diagnostic.object_id && (
              <div className="rounded-md bg-muted p-3">
                <Label className="text-xs text-muted-foreground">Titre final du ticket</Label>
                <p className="mt-1 text-sm font-mono">{buildTitle()}</p>
              </div>
            )}
          </TicketFormStep>
        )}

        {step === 3 && (
          <TicketFormStep title="Étape 3 — Détails & Médias">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={media.description}
                onChange={(e) => setMedia(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Décrivez le problème ou la demande en détail..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Pièces jointes</Label>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => imageInputRef.current?.click()} disabled={uploading}>Photo</button>
                <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => videoInputRef.current?.click()} disabled={uploading}>Vidéo</button>
                <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => audioInputRef.current?.click()} disabled={uploading}>Audio</button>
              </div>

              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile('image')} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={onPickFile('video')} />
              <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={onPickFile('audio')} />

              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={`${file.storagePath}-${index}`} className="relative rounded-md border bg-muted p-2">
                      <p className="truncate text-xs">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.type}</p>
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {diagnostic.action_key === 'verifier' && (
              <div className="space-y-2">
                <Label>Signature numérique (obligatoire pour "Je vérifie")</Label>
                <SignaturePad value={signatureDataUrl} onChange={setSignatureDataUrl} />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label>Notifications</Label>
              <RadioGroup
                value={media.notification_channel}
                onValueChange={(value) => setMedia(prev => ({ ...prev, notification_channel: value as MediaState['notification_channel'] }))}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="email" id="notif-email" />
                  <Label htmlFor="notif-email" className="font-normal">Par email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sms" id="notif-sms" />
                  <Label htmlFor="notif-sms" className="font-normal">Par SMS</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="none" id="notif-none" />
                  <Label htmlFor="notif-none" className="font-normal">Aucune notification</Label>
                </div>
              </RadioGroup>
            </div>
          </TicketFormStep>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="min-h-[44px]">
              <ArrowLeft className="mr-1 h-4 w-4" /> Précédent
            </Button>
          )}
          <div className="flex-1" />
          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="min-h-[44px]">
              Suivant <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting || !canProceed()} className="min-h-[44px]">
              {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              {submitting ? 'Envoi...' : 'Créer le ticket'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
