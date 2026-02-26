import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { closeCurrentView } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, QrCode, ArrowLeft, ArrowRight, Send, Loader2, X, Camera, Video, Mic, FileText } from 'lucide-react';
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

const URGENCY_LEVELS = [
  { value: 4, label: 'Personnes', dot: '🔴', cls: 'border-red-500 bg-red-500/10 text-red-700' },
  { value: 3, label: 'Immeuble', dot: '🟠', cls: 'border-orange-500 bg-orange-500/10 text-orange-700' },
  { value: 2, label: 'Moyen', dot: '🟡', cls: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' },
  { value: 1, label: 'Faible', dot: '🟢', cls: 'border-green-500 bg-green-500/10 text-green-700' },
] as const;

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  storagePath: string;
}

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

  const photoRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLInputElement>(null);
  const audioRef = React.useRef<HTMLInputElement>(null);
  const docRef = React.useRef<HTMLInputElement>(null);

  const { actions, getFilteredCategories, getFilteredObjects, getFilteredDetails, loading: taxLoading } = useTaxonomy();

  // --- Profile state ---
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '', last_name: '', role: '', phone: '', email: '',
  });

  // --- Diagnostic state ---
  const [actionId, setActionId] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [initiality, setInitiality] = useState<'initial' | 'relance'>('initial');
  const [categoryId, setCategoryId] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [objectId, setObjectId] = useState('');
  const [objectLabel, setObjectLabel] = useState('');
  const [detailId, setDetailId] = useState('');
  const [detailLabel, setDetailLabel] = useState('');
  const [urgency, setUrgency] = useState(2);

  // --- Media state ---
  const [description, setDescription] = useState('');
  const [notifChannel, setNotifChannel] = useState<'email' | 'sms' | 'none'>('email');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Deduplicate actions
  const uniqueActions = useMemo(() => {
    const seen = new Set<string>();
    return actions.filter((a) => {
      const k = (a.key || '').trim().toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [actions]);

  const filteredCategories = actionId ? getFilteredCategories(actionId) : [];
  const filteredObjects = categoryId ? getFilteredObjects(categoryId) : [];
  const filteredDetails = objectId ? getFilteredDetails(objectId) : [];

  // --- Load QR code ---
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('qr_codes')
          .select('*')
          .eq('target_slug', slug)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          toast({ title: 'QR Code non trouvé', variant: 'destructive' });
          return;
        }

        let elName: string | null = null;
        let grName: string | null = null;
        let enName: string | null = null;

        if (data.location_element_id) {
          const { data: el } = await supabase.from('location_elements').select('name').eq('id', data.location_element_id).single();
          elName = el?.name || null;
        }
        if (data.location_group_id) {
          const { data: gr } = await supabase.from('location_groups').select('name').eq('id', data.location_group_id).single();
          grName = gr?.name || null;
        }
        if (data.location_ensemble_id) {
          const { data: en } = await supabase.from('location_ensembles').select('name').eq('id', data.location_ensemble_id).single();
          enName = en?.name || null;
        }

        setQrCode({
          ...data,
          _elName: elName,
          _grName: grName,
          _enName: enName,
        });

        if (data.organization_id) {
          const { data: org } = await supabase.from('organizations').select('is_premium').eq('id', data.organization_id).single();
          setIsPremium(org?.is_premium ?? false);
        }
      } catch (err) {
        console.error('Error loading QR code:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, toast]);

  // --- Auto-fill profile ---
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  // --- Helpers ---
  const buildTitle = () => {
    const init = initiality === 'relance' ? 'RELANCE' : 'INITIAL';
    const axis = actionKey.toUpperCase();
    let t = `[${init}] [${axis}] ${categoryLabel} > ${objectLabel}`;
    if (detailLabel) t += ` : ${detailLabel}`;
    return t;
  };

  const canProceed = () => {
    if (step === 1) return !!(profile.last_name && profile.first_name && profile.role);
    if (step === 2) return !!(actionId && categoryId && objectId && urgency > 0);
    if (step === 3) {
      if (!description.trim()) return false;
      if (actionKey === 'verifier' && !signatureDataUrl) return false;
      return true;
    }
    return false;
  };

  const selectAction = (a: typeof uniqueActions[0]) => {
    setActionId(a.id);
    setActionKey(a.key);
    setActionLabel(a.label);
    setCategoryId('');
    setCategoryLabel('');
    setObjectId('');
    setObjectLabel('');
    setDetailId('');
    setDetailLabel('');
    setUrgency(2);
  };

  const selectCategory = (id: string) => {
    const cat = filteredCategories.find(c => c.id === id);
    setCategoryId(id);
    setCategoryLabel(cat?.label || '');
    setObjectId('');
    setObjectLabel('');
    setDetailId('');
    setDetailLabel('');
    setUrgency(2);
  };

  const selectObject = (id: string) => {
    const obj = filteredObjects.find(o => o.id === id);
    setObjectId(id);
    setObjectLabel(obj?.label || '');
    setDetailId('');
    setDetailLabel('');
    if (obj && 'urgency_level' in obj && obj.urgency_level) {
      setUrgency(obj.urgency_level);
    }
  };

  const selectDetail = (id: string) => {
    const det = filteredDetails.find(d => d.id === id);
    setDetailId(id);
    setDetailLabel(det?.label || '');
  };

  // --- File upload (raw) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux (max 20 Mo)', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('ticket-attachments').upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('ticket-attachments').getPublicUrl(path);
      setUploadedFiles(prev => [...prev, { name: file.name, url: urlData.publicUrl, type: fileType, storagePath: path }]);
      console.log('[Upload OK]', file.name, urlData.publicUrl);
    } catch (err) {
      console.error('[Upload ERROR]', err);
      toast({ title: 'Erreur upload', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (i: number) => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));

  // --- Submit ---
  const handleSubmit = async () => {
    if (!canProceed()) return;

    const { data: userData } = await supabase.auth.getUser();
    const title = DOMPurify.sanitize(buildTitle());
    const desc = DOMPurify.sanitize(description);
    const priority = urgency === 4 ? 'urgent' : urgency === 3 ? 'high' : urgency === 2 ? 'normal' : 'low';
    const locationName = qrCode?._elName || qrCode?._grName || qrCode?._enName || null;

    const ticketData: Record<string, unknown> = {
      title,
      description: desc,
      priority,
      status: 'open',
      created_by: userData?.user?.id || null,
      building_id: qrCode?.building_id || null,
      organization_id: qrCode?.organization_id || null,
      source: 'qr_code',
      initiality,
      action_code: actionId || null,
      category_id: categoryId || null,
      object_id: objectId || null,
      reporter_name: DOMPurify.sanitize(`${profile.last_name} ${profile.first_name}`.trim()),
      reporter_email: profile.email || null,
      reporter_phone: profile.phone || null,
      location: {
        element_id: qrCode?.location_element_id || null,
        group_id: qrCode?.location_group_id || null,
        ensemble_id: qrCode?.location_ensemble_id || null,
        name: locationName,
      },
      attachments: uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type, storage_path: f.storagePath })),
      meta: {
        qr_code_id: qrCode?.id,
        reporter_role: profile.role,
        detail_id: detailId || null,
        detail_label: detailLabel || null,
        urgency_level: urgency,
        notification_channel: notifChannel,
        signature: actionKey === 'verifier' ? signatureDataUrl : null,
        action_id: actionId,
        action_key: actionKey,
        action_label: actionLabel,
        category_label: categoryLabel,
        object_label: objectLabel,
      },
    };

    // *** ALERT DEBUG pour vérifier les données ***
    alert(JSON.stringify(ticketData, null, 2));

    console.log('[TicketForm] SUBMIT PAYLOAD:', ticketData);

    try {
      setSubmitting(true);
      const { error } = await supabase.from('tickets').insert(ticketData as any);
      if (error) throw error;
      setSubmitted(true);
      toast({ title: 'Ticket créé avec succès !' });
    } catch (err: any) {
      console.error('[TicketForm] INSERT ERROR:', err);
      toast({ title: 'Erreur', description: err?.message || 'Impossible de créer le ticket', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render: Loading ---
  if (loading || taxLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Render: QR not found ---
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

  // --- Render: Success ---
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ticket créé !</h3>
            <p className="text-muted-foreground mb-4">Votre signalement a été enregistré.</p>
            <Button onClick={() => closeCurrentView(navigate)} className="min-h-[44px]">Fermer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const locationName = qrCode?._elName || qrCode?._grName || qrCode?._enName || 'Non défini';

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

        {/* ============ ÉTAPE 1 : PROFIL ============ */}
        {step === 1 && <ReportStepProfile data={profile} onChange={setProfile} />}

        {/* ============ ÉTAPE 2 : DIAGNOSTIC ============ */}
        {step === 2 && (
          <TicketFormStep title="Étape 2 — Diagnostic">
            {/* 1. AXE (boutons) */}
            <div className="space-y-2">
              <Label>Que souhaitez-vous faire ? *</Label>
              <div className="grid grid-cols-2 gap-3">
                {uniqueActions.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectAction(a)}
                    className={`p-4 rounded-lg border-2 text-center text-sm font-medium transition-all min-h-[60px] ${
                      actionId === a.id
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {a.label}
                    {a.description && <span className="block text-xs text-muted-foreground mt-1">{a.description}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. INITIATIVE (boutons) */}
            {actionId && (
              <div className="space-y-2">
                <Label>Initiative *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInitiality('initial')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium min-h-[44px] ${
                      initiality === 'initial' ? 'border-primary bg-primary/10 shadow-md' : 'border-border'
                    }`}
                  >
                    Initial
                  </button>
                  <button
                    type="button"
                    onClick={() => setInitiality('relance')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium min-h-[44px] ${
                      initiality === 'relance' ? 'border-primary bg-primary/10 shadow-md' : 'border-border'
                    }`}
                  >
                    Relance
                  </button>
                </div>
              </div>
            )}

            {/* 3. CATÉGORIE (select) */}
            {actionId && (
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={categoryId || undefined} onValueChange={selectCategory}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 4. OBJET (select) */}
            {categoryId && (
              <div className="space-y-2">
                <Label>Objet *</Label>
                <Select value={objectId || undefined} onValueChange={selectObject}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir un objet" /></SelectTrigger>
                  <SelectContent>
                    {filteredObjects.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 4b. DÉTAIL (select optionnel) */}
            {objectId && filteredDetails.length > 0 && (
              <div className="space-y-2">
                <Label>Nature / Détail</Label>
                <Select value={detailId || undefined} onValueChange={selectDetail}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Préciser (optionnel)" /></SelectTrigger>
                  <SelectContent>
                    {filteredDetails.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 5. URGENCE (pastilles) */}
            {objectId && (
              <div className="space-y-2">
                <Label>Niveau d'urgence *</Label>
                <div className="space-y-2">
                  {URGENCY_LEVELS.map(u => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setUrgency(u.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-sm font-medium text-left transition-all min-h-[44px] ${
                        urgency === u.value ? u.cls + ' shadow-md ring-2 ring-primary/30' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span className="text-lg">{u.dot}</span>
                      <span>{u.value} - {u.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Titre preview */}
            {actionId && categoryId && objectId && (
              <div className="rounded-md bg-muted p-3">
                <Label className="text-xs text-muted-foreground">Titre final du ticket</Label>
                <p className="mt-1 text-sm font-mono">{buildTitle()}</p>
              </div>
            )}
          </TicketFormStep>
        )}

        {/* ============ ÉTAPE 3 : MÉDIAS ============ */}
        {step === 3 && (
          <TicketFormStep title="Étape 3 — Détails & Médias">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Décrivez le problème ou la demande en détail..."
                className="min-h-[100px]"
              />
            </div>

            {/* UPLOAD : 4 gros boutons iconographiques */}
            <div className="space-y-3">
              <Label>Pièces jointes</Label>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => handleFileUpload(e, 'image')} />
              <input ref={videoRef} type="file" accept="video/*" className="hidden" disabled={uploading} onChange={e => handleFileUpload(e, 'video')} />
              <input ref={audioRef} type="file" accept="audio/*" className="hidden" disabled={uploading} onChange={e => handleFileUpload(e, 'audio')} />
              <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" disabled={uploading} onChange={e => handleFileUpload(e, 'document')} />

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => photoRef.current?.click()} disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all min-h-[80px]">
                  <Camera className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Photo</span>
                </button>
                <button type="button" onClick={() => videoRef.current?.click()} disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all min-h-[80px]">
                  <Video className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Vidéo</span>
                </button>
                <button type="button" onClick={() => audioRef.current?.click()} disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all min-h-[80px]">
                  <Mic className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Audio</span>
                </button>
                <button type="button" onClick={() => docRef.current?.click()} disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all min-h-[80px]">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Document</span>
                </button>
              </div>

              {uploading && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Upload en cours...</p>}

              {uploadedFiles.length > 0 && (
                <div className="space-y-1">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                      <span className="truncate">{f.type} — {f.name}</span>
                      <button type="button" onClick={() => removeFile(i)}><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {actionKey === 'verifier' && (
              <div className="space-y-2">
                <Label>Signature numérique (obligatoire)</Label>
                <SignaturePad value={signatureDataUrl} onChange={setSignatureDataUrl} />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label>Notifications</Label>
              <RadioGroup value={notifChannel} onValueChange={v => setNotifChannel(v as any)} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="email" id="n-email" />
                  <Label htmlFor="n-email" className="font-normal">Par email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sms" id="n-sms" />
                  <Label htmlFor="n-sms" className="font-normal">Par SMS</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="none" id="n-none" />
                  <Label htmlFor="n-none" className="font-normal">Aucune</Label>
                </div>
              </RadioGroup>
            </div>
          </TicketFormStep>
        )}

        {/* NAV */}
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
