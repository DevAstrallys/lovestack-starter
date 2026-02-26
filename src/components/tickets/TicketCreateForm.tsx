import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Send, Loader2, X, Camera, Video, Mic, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTaxonomy } from '@/hooks/useTaxonomy';
import { TicketFormStep } from './TicketFormStep';
import { SignaturePad } from '@/components/report/SignaturePad';
import DOMPurify from 'dompurify';

const TOTAL_STEPS = 3;

const URGENCY_LEVELS = [
  { value: 4, label: 'Personnes', dot: '🔴', cls: 'border-red-500 bg-red-500/10 text-red-700' },
  { value: 3, label: 'Immeuble', dot: '🟠', cls: 'border-orange-500 bg-orange-500/10 text-orange-700' },
  { value: 2, label: 'Moyen', dot: '🟡', cls: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' },
  { value: 1, label: 'Faible', dot: '🟢', cls: 'border-green-500 bg-green-500/10 text-green-700' },
] as const;

const ROLES = [
  { value: 'locataire', label: 'Locataire' },
  { value: 'proprietaire', label: 'Propriétaire' },
  { value: 'prestataire', label: 'Prestataire' },
  { value: 'visiteur', label: 'Visiteur' },
  { value: 'gardien', label: 'Gardien' },
  { value: 'autre', label: 'Autre' },
];

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  storagePath: string;
}

interface TicketCreateFormProps {
  onSuccess?: () => void;
}

export const TicketCreateForm = ({ onSuccess }: TicketCreateFormProps) => {
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const photoRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLInputElement>(null);
  const audioRef = React.useRef<HTMLInputElement>(null);
  const docRef = React.useRef<HTMLInputElement>(null);

  // --- Location hierarchy ---
  const [ensembles, setEnsembles] = useState<Array<{ id: string; name: string }>>([]);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [elements, setElements] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEnsembleId, setSelectedEnsembleId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedElementId, setSelectedElementId] = useState('');

  // --- Profile ---
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // --- Taxonomy ---
  const { actions, getFilteredCategories, getFilteredObjects, getFilteredDetails, loading: taxLoading } = useTaxonomy();

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

  // --- Media ---
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

  // --- Auto-fill profile from auth ---
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single();
      if (prof) {
        const parts = (prof.full_name || '').split(' ');
        setLastName(parts[0] || '');
        setFirstName(parts.slice(1).join(' ') || '');
        setPhone(prof.phone || '');
      }
      setEmail(user.email || '');
    })();
  }, [user]);

  // --- Load location ensembles for selected org ---
  useEffect(() => {
    if (!selectedOrganization) return;
    (async () => {
      const { data } = await supabase
        .from('location_ensembles')
        .select('id, name')
        .eq('organization_id', selectedOrganization.id)
        .order('name');
      setEnsembles(data || []);
    })();
  }, [selectedOrganization]);

  // --- Load groups when ensemble selected ---
  useEffect(() => {
    if (!selectedEnsembleId) { setGroups([]); return; }
    (async () => {
      const { data } = await supabase
        .from('location_groups')
        .select('id, name')
        .eq('parent_id', selectedEnsembleId)
        .order('name');
      setGroups(data || []);
    })();
  }, [selectedEnsembleId]);

  // --- Load elements when group selected ---
  useEffect(() => {
    if (!selectedGroupId) { setElements([]); return; }
    (async () => {
      const { data } = await supabase
        .from('location_elements')
        .select('id, name')
        .eq('parent_id', selectedGroupId)
        .order('name');
      setElements(data || []);
    })();
  }, [selectedGroupId]);

  // --- Helpers ---
  const buildTitle = () => {
    const init = initiality === 'relance' ? 'RELANCE' : 'INITIAL';
    const axis = actionKey.toUpperCase();
    let t = `[${init}] [${axis}] ${categoryLabel} > ${objectLabel}`;
    if (detailLabel) t += ` : ${detailLabel}`;
    return t;
  };

  const canProceed = () => {
    if (step === 1) return !!(lastName && firstName && role);
    if (step === 2) return !!(actionId && categoryId && objectId && urgency > 0);
    if (step === 3) return !!description.trim() && (actionKey !== 'verifier' || !!signatureDataUrl);
    return false;
  };

  const selectAction = (a: typeof uniqueActions[0]) => {
    setActionId(a.id); setActionKey(a.key); setActionLabel(a.label);
    setCategoryId(''); setCategoryLabel('');
    setObjectId(''); setObjectLabel('');
    setDetailId(''); setDetailLabel('');
    setUrgency(2);
  };

  const selectCategory = (id: string) => {
    const cat = filteredCategories.find(c => c.id === id);
    setCategoryId(id); setCategoryLabel(cat?.label || '');
    setObjectId(''); setObjectLabel('');
    setDetailId(''); setDetailLabel('');
    setUrgency(2);
  };

  const selectObject = (id: string) => {
    const obj = filteredObjects.find(o => o.id === id);
    setObjectId(id); setObjectLabel(obj?.label || '');
    setDetailId(''); setDetailLabel('');
    if (obj && 'urgency_level' in obj && obj.urgency_level) setUrgency(obj.urgency_level);
  };

  const selectDetail = (id: string) => {
    const det = filteredDetails.find(d => d.id === id);
    setDetailId(id); setDetailLabel(det?.label || '');
  };

  // --- File upload ---
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

  // --- REAL Submit ---
  const handleSubmit = async () => {
    if (!canProceed()) return;
    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' });
      return;
    }

    const title = DOMPurify.sanitize(buildTitle());
    const desc = DOMPurify.sanitize(description);
    const priority = urgency === 4 ? 'urgent' : urgency === 3 ? 'high' : urgency === 2 ? 'normal' : 'low';

    const locationName = elements.find(e => e.id === selectedElementId)?.name
      || groups.find(g => g.id === selectedGroupId)?.name
      || ensembles.find(e => e.id === selectedEnsembleId)?.name
      || null;

    const ticketData: Record<string, unknown> = {
      title,
      description: desc,
      priority,
      status: 'open',
      created_by: user.id,
      organization_id: selectedOrganization?.id || null,
      source: 'dashboard',
      initiality,
      action_code: actionId || null,
      category_id: categoryId || null,
      object_id: objectId || null,
      reporter_name: DOMPurify.sanitize(`${lastName} ${firstName}`.trim()),
      reporter_email: email || null,
      reporter_phone: phone || null,
      location: {
        element_id: selectedElementId || null,
        group_id: selectedGroupId || null,
        ensemble_id: selectedEnsembleId || null,
        name: locationName,
      },
      attachments: uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type, storage_path: f.storagePath })),
      meta: {
        reporter_role: role,
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
        organization_id: selectedOrganization?.id || null,
      },
    };

    // *** DEBUG ALERT ***
    alert(JSON.stringify(ticketData, null, 2));
    console.log('[TicketCreateForm] SUBMIT PAYLOAD:', ticketData);

    try {
      setSubmitting(true);
      const { error } = await supabase.from('tickets').insert(ticketData as any);
      if (error) throw error;
      toast({ title: 'Ticket créé avec succès !' });
      onSuccess?.();
    } catch (err: any) {
      console.error('[TicketCreateForm] INSERT ERROR:', err);
      toast({ title: 'Erreur', description: err?.message || 'Impossible de créer le ticket', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (taxLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Étape {step} / {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
      </div>

      {/* ============ ÉTAPE 1 : PROFIL + LIEU ============ */}
      {step === 1 && (
        <TicketFormStep title="Étape 1 — Qui êtes-vous ?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cf-last_name">Nom *</Label>
              <Input id="cf-last_name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-first_name">Prénom *</Label>
              <Input id="cf-first_name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" className="min-h-[44px]" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rôle *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner votre rôle" /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cf-phone">Mobile</Label>
              <Input id="cf-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-email">Email</Label>
              <Input id="cf-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.com" className="min-h-[44px]" />
            </div>
          </div>

          {/* Lieu (hiérarchie Ensemble > Groupe > Élément) */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <Label className="text-base font-semibold">Localisation</Label>
            {selectedOrganization && (
              <p className="text-xs text-muted-foreground">Organisation : {selectedOrganization.name}</p>
            )}

            <div className="space-y-2">
              <Label>Ensemble (Copropriété)</Label>
              <Select value={selectedEnsembleId || undefined} onValueChange={v => { setSelectedEnsembleId(v); setSelectedGroupId(''); setSelectedElementId(''); }}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner un ensemble" /></SelectTrigger>
                <SelectContent>
                  {ensembles.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedEnsembleId && groups.length > 0 && (
              <div className="space-y-2">
                <Label>Groupement (Bâtiment)</Label>
                <Select value={selectedGroupId || undefined} onValueChange={v => { setSelectedGroupId(v); setSelectedElementId(''); }}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner un groupement" /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedGroupId && elements.length > 0 && (
              <div className="space-y-2">
                <Label>Élément (Appartement / Local)</Label>
                <Select value={selectedElementId || undefined} onValueChange={setSelectedElementId}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner un élément" /></SelectTrigger>
                  <SelectContent>
                    {elements.map(el => <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TicketFormStep>
      )}

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

          {/* 4b. DÉTAIL (optionnel) */}
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
            <Label htmlFor="cf-description">Description *</Label>
            <Textarea
              id="cf-description"
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
                <RadioGroupItem value="email" id="cf-n-email" />
                <Label htmlFor="cf-n-email" className="font-normal">Par email</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sms" id="cf-n-sms" />
                <Label htmlFor="cf-n-sms" className="font-normal">Par SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="none" id="cf-n-none" />
                <Label htmlFor="cf-n-none" className="font-normal">Aucune</Label>
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
  );
};
