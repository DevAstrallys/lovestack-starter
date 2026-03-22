import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { closeCurrentView } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, CheckCircle, QrCode, ArrowLeft, ArrowRight, Send, Loader2,
  X, Camera, Video, Mic, FileText, Copy, ExternalLink, MapPin, Users, Info,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';
import { SignaturePad } from '@/components/report/SignaturePad';
import { AdBanner } from '@/components/report/AdBanner';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'dompurify';
import { createLogger } from '@/lib/logger';
import {
  createTicket as createTicketService,
  uploadTicketAttachment,
  fetchQrCodeBySlug,
  fetchOrganizationPremiumStatus,
} from '@/services/tickets';
import {
  fetchTaxActions,
  fetchTaxCategories,
  fetchTaxObjects,
  upsertTaxSuggestion,
  searchDuplicateTickets,
  followTicket,
  fetchOrganizationLocations,
  type DuplicateCandidate,
} from '@/services/tickets/taxonomy';
import { getCurrentUser } from '@/services/auth';
import { fetchProfile } from '@/services/users';
import { sendEmail } from '@/services/notifications';
import { generateTrackingCode } from '@/services/tickets/tracking';

const log = createLogger('page:ticketForm');

const TOTAL_STEPS = 3;

const URGENCY_LEVELS = [
  { value: 4, label: 'Personnes', sla: '< 1h', dot: '🔴', cls: 'border-red-500 bg-red-500/10 text-red-700' },
  { value: 3, label: 'Immeuble', sla: '< 24h', dot: '🟠', cls: 'border-orange-500 bg-orange-500/10 text-orange-700' },
  { value: 2, label: 'Moyen', sla: '< 72h', dot: '🟡', cls: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' },
  { value: 1, label: 'Faible', sla: '< 7 jours', dot: '🟢', cls: 'border-green-500 bg-green-500/10 text-green-700' },
] as const;

const PROFILE_ROLES = [
  { value: 'locataire', label: 'Locataire' },
  { value: 'proprietaire', label: 'Propriétaire occupant' },
  { value: 'proprietaire_bailleur', label: 'Propriétaire bailleur' },
  { value: 'gardien', label: 'Gardien / Concierge' },
  { value: 'conseil_syndical', label: 'Membre du conseil syndical' },
  { value: 'prestataire', label: 'Prestataire / Technicien' },
  { value: 'visiteur', label: 'Visiteur' },
];

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  storagePath: string;
}

interface TaxAction {
  id: string; key: string; label: string; icon?: string | null; color?: string | null; description?: string | null;
}
interface TaxCategory {
  id: string; key: string; label: string; action_id: string;
}
interface TaxObject {
  id: string; key: string; label: string; category_id: string; urgency_level?: number | null; is_private?: boolean | null;
}

export function TicketForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'guest';
  const { toast } = useToast();

  // --- Core state ---
  const [qrCode, setQrCode] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketShortId, setTicketShortId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  // --- Taxonomy data ---
  const [actions, setActions] = useState<TaxAction[]>([]);
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [objects, setObjects] = useState<TaxObject[]>([]);
  const [taxLoading, setTaxLoading] = useState(true);

  // --- Camera / Audio refs ---
  const cameraVideoRef = React.useRef<HTMLVideoElement>(null);
  const cameraStreamRef = React.useRef<MediaStream | null>(null);
  const audioRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioStreamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);

  // --- Step 1: Profile ---
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // --- Step 2: Diagnostic ---
  const [actionId, setActionId] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [initiality, setInitiality] = useState<'initial' | 'relance'>('initial');
  const [relanceCode, setRelanceCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [freeCategory, setFreeCategory] = useState('');
  const [showFreeCategory, setShowFreeCategory] = useState(false);
  const [objectId, setObjectId] = useState('');
  const [objectLabel, setObjectLabel] = useState('');
  const [freeObject, setFreeObject] = useState('');
  const [showFreeObject, setShowFreeObject] = useState(false);
  const [urgency, setUrgency] = useState(2);
  const [locationMode, setLocationMode] = useState<'here' | 'other' | 'free'>('here');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<'element' | 'group'>('element');
  const [freeLocation, setFreeLocation] = useState('');
  const [orgLocations, setOrgLocations] = useState<{ elements: any[]; groups: any[] }>({ elements: [], groups: [] });

  // --- Step 3: Media & Details ---
  const [description, setDescription] = useState('');
  const [notifChannel, setNotifChannel] = useState<'email' | 'sms' | 'app' | 'none'>('email');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // --- Duplicates ---
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [duplicatesChecked, setDuplicatesChecked] = useState(false);
  const [duplicatesDismissed, setDuplicatesDismissed] = useState(false);

  // --- Load QR code ---
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchQrCodeBySlug(slug);
        if (!data) {
          toast({ title: 'QR Code non trouvé', variant: 'destructive' });
          return;
        }
        setQrCode(data);
        if (data.organization_id) {
          const premium = await fetchOrganizationPremiumStatus(data.organization_id);
          setIsPremium(premium);
        }
      } catch (err) {
        log.error('Error loading QR code', { slug, error: err });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, toast]);

  // --- Load taxonomy actions ---
  useEffect(() => {
    (async () => {
      try {
        setTaxLoading(true);
        const data = await fetchTaxActions();
        setActions(data);
      } catch (err) {
        log.error('Failed to load actions', { error: err });
      } finally {
        setTaxLoading(false);
      }
    })();
  }, []);

  // --- Load categories when action changes ---
  useEffect(() => {
    if (!actionId) { setCategories([]); return; }
    (async () => {
      const data = await fetchTaxCategories(actionId);
      setCategories(data);
    })();
  }, [actionId]);

  // --- Load objects when category changes ---
  useEffect(() => {
    if (!categoryId) { setObjects([]); return; }
    (async () => {
      const data = await fetchTaxObjects(categoryId);
      setObjects(data);
    })();
  }, [categoryId]);

  // --- Load org locations when switching to 'other' ---
  useEffect(() => {
    if (locationMode === 'other' && qrCode?.organization_id && orgLocations.elements.length === 0) {
      (async () => {
        const locs = await fetchOrganizationLocations(qrCode.organization_id);
        setOrgLocations(locs);
      })();
    }
  }, [locationMode, qrCode?.organization_id]);

  // --- Auto-fill profile ---
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const prof = await fetchProfile(user.id);
          if (prof) {
            const parts = (prof.full_name || '').split(' ');
            setLastName(parts[0] || '');
            setFirstName(parts.slice(1).join(' ') || '');
            setEmail(user.email || '');
            setPhone(prof.phone || '');
          }
        }
      } catch (err) {
        log.debug('Auto-fill profile skipped', { error: err });
      }
    })();
  }, []);

  // --- Cleanup streams on unmount ---
  useEffect(() => {
    return () => {
      if (audioRecorderRef.current?.state === 'recording') audioRecorderRef.current.stop();
      audioStreamRef.current?.getTracks().forEach(t => t.stop());
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

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

  // --- Helpers ---
  const buildTitle = useCallback(() => {
    const catDisplay = showFreeCategory ? freeCategory : categoryLabel;
    const objDisplay = showFreeObject ? freeObject : objectLabel;

    if (initiality === 'relance' && relanceCode) {
      return `relance ${actionLabel} #${relanceCode} — ${catDisplay} > ${objDisplay}`;
    }
    return `${actionLabel} — ${catDisplay} > ${objDisplay} · urgence ${urgency}`;
  }, [initiality, relanceCode, actionLabel, categoryLabel, objectLabel, freeCategory, freeObject, showFreeCategory, showFreeObject, urgency]);

  const canProceed = () => {
    if (step === 1) return !!(lastName && firstName && profileRole);
    if (step === 2) {
      const hasCat = categoryId || (showFreeCategory && freeCategory.trim());
      const hasObj = objectId || (showFreeObject && freeObject.trim());
      return !!(actionId && hasCat && hasObj && urgency > 0);
    }
    if (step === 3) {
      if (!description.trim()) return false;
      if (actionKey === 'verifier' && !signatureDataUrl) return false;
      return true;
    }
    return false;
  };

  const selectAction = (a: TaxAction) => {
    setActionId(a.id);
    setActionKey(a.key);
    setActionLabel(a.label);
    setCategoryId(''); setCategoryLabel(''); setShowFreeCategory(false); setFreeCategory('');
    setObjectId(''); setObjectLabel(''); setShowFreeObject(false); setFreeObject('');
    setUrgency(2);
  };

  const selectCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    setCategoryId(id);
    setCategoryLabel(cat?.label || '');
    setObjectId(''); setObjectLabel(''); setShowFreeObject(false); setFreeObject('');
    setUrgency(2);
    setShowFreeCategory(false);
    setFreeCategory('');
  };

  const selectObject = (id: string) => {
    const obj = objects.find(o => o.id === id);
    setObjectId(id);
    setObjectLabel(obj?.label || '');
    if (obj?.urgency_level) setUrgency(obj.urgency_level);
    setShowFreeObject(false);
    setFreeObject('');
  };

  // --- File upload ---
  const uploadFile = async (file: File, fileType: string) => {
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux (max 20 Mo)', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const result = await uploadTicketAttachment(crypto.randomUUID(), file);
      setUploadedFiles(prev => [...prev, { name: file.name, url: result.publicUrl, type: fileType, storagePath: result.publicUrl }]);
      log.info('File uploaded', { fileName: file.name, fileType });
    } catch (err) {
      log.error('File upload failed', { fileName: file.name, error: err });
      toast({ title: 'Erreur upload', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, fileType);
    e.target.value = '';
  };

  const stopCameraStream = () => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
  };

  const startCameraCapture = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: 'Caméra non supportée', variant: 'destructive' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
      });
    } catch (error) {
      log.error('Camera access denied', { error });
      toast({ title: 'Accès caméra refusé', variant: 'destructive' });
    }
  };

  const capturePhoto = async () => {
    const video = cameraVideoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await uploadFile(file, 'image');
      stopCameraStream();
    }, 'image/jpeg', 0.92);
  };

  const toggleAudioRecording = async () => {
    if (recordingAudio && audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      setRecordingAudio(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      const fallback = document.getElementById('upload-audio-fallback') as HTMLInputElement | null;
      fallback?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: mimeType });
        await uploadFile(file, 'audio');
        audioStreamRef.current?.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setRecordingAudio(true);
    } catch (error) {
      log.error('Audio recording failed', { error });
      toast({ title: 'Accès micro refusé', variant: 'destructive' });
    }
  };

  const removeFile = (i: number) => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));

  // --- Check duplicates when entering step 3 ---
  const checkDuplicates = useCallback(async () => {
    if (!qrCode?.organization_id || !categoryId || duplicatesChecked) return;
    setDuplicatesChecked(true);
    const results = await searchDuplicateTickets({
      organizationId: qrCode.organization_id,
      categoryId,
    });
    if (results.length > 0) setDuplicates(results);
  }, [qrCode?.organization_id, categoryId, duplicatesChecked]);

  const handleFollowTicket = async (ticketId: string) => {
    const user = await getCurrentUser();
    if (!user) {
      toast({ title: 'Connectez-vous pour suivre un ticket', variant: 'destructive' });
      return;
    }
    const ok = await followTicket(ticketId, user.id);
    if (ok) {
      toast({ title: 'Vous suivez ce ticket !' });
      setDuplicatesDismissed(true);
    }
  };

  // --- Step navigation ---
  const goToStep = (next: number) => {
    if (next === 3) checkDuplicates();
    setStep(next);
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!canProceed()) return;

    const user = await getCurrentUser();
    const title = DOMPurify.sanitize(buildTitle());
    const desc = DOMPurify.sanitize(description);
    const priority = urgency === 4 ? 'urgent' : urgency === 3 ? 'high' : urgency === 2 ? 'normal' : 'low';

    // Location resolution
    let locationPayload: Record<string, any> = {};
    if (locationMode === 'here') {
      locationPayload = {
        element_id: qrCode?.location_element_id || null,
        group_id: qrCode?.location_group_id || null,
        ensemble_id: qrCode?.location_ensemble_id || null,
        name: qrCode?._elName || qrCode?._grName || qrCode?._enName || null,
      };
    } else if (locationMode === 'other' && selectedLocationId) {
      const loc = selectedLocationType === 'element'
        ? orgLocations.elements.find(e => e.id === selectedLocationId)
        : orgLocations.groups.find(g => g.id === selectedLocationId);
      locationPayload = {
        [`${selectedLocationType === 'element' ? 'element_id' : 'group_id'}`]: selectedLocationId,
        name: loc?.name || null,
      };
    } else if (locationMode === 'free') {
      locationPayload = { name: freeLocation };
    }

    // Generate tracking code (guest only)
    const isGuest = mode === 'guest';
    const newTrackingCode = isGuest ? generateTrackingCode() : '';

    const ticketData: Record<string, unknown> = {
      title,
      description: desc,
      priority,
      status: 'open',
      created_by: user?.id || null,
      building_id: qrCode?.building_id || null,
      organization_id: qrCode?.organization_id || null,
      source: 'qr_code',
      initiality,
      action_code: actionId || null,
      category_id: showFreeCategory ? null : (categoryId || null),
      object_id: showFreeObject ? null : (objectId || null),
      reporter_name: DOMPurify.sanitize(`${lastName} ${firstName}`.trim()),
      reporter_email: email || null,
      reporter_phone: phone || null,
      location: locationPayload,
      attachments: uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type, storage_path: f.storagePath })),
      meta: {
        qr_code_id: qrCode?.id,
        reporter_role: profileRole,
        urgency_level: urgency,
        notification_channel: notifChannel === 'app' ? 'email' : notifChannel,
        signature: actionKey === 'verifier' ? signatureDataUrl : null,
        action_id: actionId,
        action_key: actionKey,
        action_label: actionLabel,
        category_label: showFreeCategory ? freeCategory : categoryLabel,
        object_label: showFreeObject ? freeObject : objectLabel,
        ...(showFreeCategory ? { free_category: freeCategory } : {}),
        ...(showFreeObject ? { free_object: freeObject } : {}),
        ...(locationMode === 'free' ? { free_location: freeLocation } : {}),
        ...(initiality === 'relance' && relanceCode ? { follow_up_code: relanceCode } : {}),
        ...(newTrackingCode ? { tracking_code: newTrackingCode } : {}),
      },
    };

    log.info('Submitting ticket', { title, priority, source: 'qr_code', mode });

    try {
      setSubmitting(true);

      // 1. Upsert tax suggestions if free text was used
      if (showFreeCategory && freeCategory.trim()) {
        await upsertTaxSuggestion({
          type: 'category', freeText: freeCategory, actionId,
          organizationId: qrCode?.organization_id, qrCodeId: qrCode?.id,
        });
      }
      if (showFreeObject && freeObject.trim()) {
        await upsertTaxSuggestion({
          type: 'object', freeText: freeObject, categoryId: showFreeCategory ? undefined : categoryId,
          actionId, organizationId: qrCode?.organization_id, qrCodeId: qrCode?.id,
        });
      }
      if (locationMode === 'free' && freeLocation.trim()) {
        await upsertTaxSuggestion({
          type: 'location', freeText: freeLocation,
          organizationId: qrCode?.organization_id, qrCodeId: qrCode?.id,
        });
      }

      // 2. Create ticket
      const ticket = await createTicketService(ticketData as any);
      setTicketShortId(ticket.id.substring(0, 8).toUpperCase());
      if (newTrackingCode) setTrackingCode(newTrackingCode);

      // 3. Send notification
      if ((notifChannel === 'email' || notifChannel === 'app') && email) {
        try {
          const emailMessage = newTrackingCode
            ? `Votre ticket "${title}" a bien été créé. Votre code de suivi : ${newTrackingCode}. Conservez-le pour suivre votre demande.`
            : `Votre ticket "${title}" a bien été créé. Vous recevrez des mises à jour par email.`;
          await sendEmail({
            template: 'notification',
            to: [email],
            data: {
              recipientName: `${firstName} ${lastName}`.trim(),
              title: 'Votre signalement a été enregistré',
              message: emailMessage,
              ticketId: ticket.id,
              ticketTitle: title,
              trackingCode: newTrackingCode || undefined,
            },
          });
          log.info('Confirmation email sent', { ticketId: ticket.id, to: email });
        } catch (notifErr) {
          log.warn('Confirmation email failed (non-blocking)', { ticketId: ticket.id, error: notifErr });
        }
      } else if (notifChannel === 'sms' && phone) {
        log.info('SMS notification requested but not yet implemented', { ticketId: ticket.id });
      }

      setSubmitted(true);
      toast({ title: 'Ticket créé avec succès !' });
    } catch (err: any) {
      log.error('Ticket creation failed', { error: err });
      toast({ title: 'Erreur', description: err?.message || 'Impossible de créer le ticket', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render: Loading ───
  if (loading || taxLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Render: QR not found ───
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

  // ─── Render: Success ───
  if (submitted) {
    const isGuest = mode === 'guest';
    const handleCopyCode = async () => {
      try {
        await navigator.clipboard.writeText(trackingCode);
        toast({ title: 'Code copié !' });
      } catch {
        toast({ title: 'Impossible de copier', variant: 'destructive' });
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Ticket créé !</h3>

            {isGuest && trackingCode && (
              <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Votre code de suivi</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-foreground">{trackingCode}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleCopyCode}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copier le code
                </Button>
              </div>
            )}

            {!isGuest && ticketShortId && (
              <p className="text-sm text-muted-foreground">
                Votre ticket est enregistré. Retrouvez-le dans votre espace personnel.
              </p>
            )}

            {isGuest && trackingCode && (
              <p className="text-muted-foreground text-sm">
                Conservez ce code pour suivre l'avancement de votre demande.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {isGuest && trackingCode && slug && (
                <Button variant="default" className="w-full min-h-[44px]" onClick={() => navigate(`/suivi/${slug}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Suivre ma demande
                </Button>
              )}
              <Button variant="outline" onClick={() => closeCurrentView(navigate)} className="w-full min-h-[44px]">
                Fermer
              </Button>
            </div>
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

        {/* ============ ÉTAPE 1 : QUI ÊTES-VOUS ? ============ */}
        {step === 1 && (
          <TicketFormStep title="Étape 1 — Qui êtes-vous ?">
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Marie" />
            </div>
            <div className="space-y-2">
              <Label>Rôle *</Label>
              <Select value={profileRole} onValueChange={setProfileRole}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner votre rôle" /></SelectTrigger>
                <SelectContent>
                  {PROFILE_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marie@exemple.fr" />
            </div>
          </TicketFormStep>
        )}

        {/* ============ ÉTAPE 2 : QUOI & OÙ ? ============ */}
        {step === 2 && (
          <TicketFormStep title="Étape 2 — Quoi & Où ?">
            {/* A) Actions */}
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

            {/* B) Initiality */}
            {actionId && (
              <div className="space-y-2">
                <Label>Type *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['initial', 'relance'] as const).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInitiality(val)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium min-h-[44px] capitalize ${
                        initiality === val ? 'border-primary bg-primary/10 shadow-md' : 'border-border'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                {initiality === 'relance' && (
                  <div className="space-y-1 mt-2">
                    <Label htmlFor="relanceCode">Code de suivi initial</Label>
                    <Input
                      id="relanceCode"
                      value={relanceCode}
                      onChange={e => setRelanceCode(e.target.value.toUpperCase())}
                      placeholder="AB12-CD34"
                      className="font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* C) Category */}
            {actionId && (
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                {!showFreeCategory ? (
                  <>
                    <Select value={categoryId || undefined} onValueChange={selectCategory}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => { setShowFreeCategory(true); setCategoryId(''); setCategoryLabel(''); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Je ne trouve pas la bonne catégorie
                    </button>
                  </>
                ) : (
                  <>
                    <Input
                      value={freeCategory}
                      onChange={e => setFreeCategory(e.target.value)}
                      placeholder="Décrivez la catégorie..."
                    />
                    <button
                      type="button"
                      onClick={() => { setShowFreeCategory(false); setFreeCategory(''); }}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      ← Revenir à la liste
                    </button>
                  </>
                )}
              </div>
            )}

            {/* D) Object */}
            {(categoryId || (showFreeCategory && freeCategory.trim())) && (
              <div className="space-y-2">
                <Label>Objet *</Label>
                {!showFreeObject && !showFreeCategory ? (
                  <>
                    <Select value={objectId || undefined} onValueChange={selectObject}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir un objet" /></SelectTrigger>
                      <SelectContent>
                        {objects.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => { setShowFreeObject(true); setObjectId(''); setObjectLabel(''); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Je ne trouve pas le bon objet
                    </button>
                  </>
                ) : (
                  <>
                    <Input
                      value={freeObject}
                      onChange={e => setFreeObject(e.target.value)}
                      placeholder="Décrivez l'objet..."
                    />
                    {!showFreeCategory && (
                      <button
                        type="button"
                        onClick={() => { setShowFreeObject(false); setFreeObject(''); }}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        ← Revenir à la liste
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* E) Urgency */}
            {(objectId || (showFreeObject && freeObject.trim()) || (showFreeCategory && freeCategory.trim())) && (
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
                      <span>{u.value} — {u.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{u.sla}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* F) Location */}
            {actionId && (
              <div className="space-y-2">
                <Label>Localisation</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setLocationMode('here'); setFreeLocation(''); setSelectedLocationId(''); }}
                    className={`p-3 rounded-lg border-2 text-sm font-medium min-h-[44px] flex items-center gap-2 justify-center ${
                      locationMode === 'here' ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    <MapPin className="h-4 w-4" /> Ici (QR code)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode('other')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium min-h-[44px] ${
                      locationMode === 'other' ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    Autre endroit
                  </button>
                </div>

                {locationMode === 'other' && (
                  <div className="space-y-2 mt-2">
                    <Select value={selectedLocationId || undefined} onValueChange={(val) => {
                      const isElement = orgLocations.elements.some(e => e.id === val);
                      setSelectedLocationId(val);
                      setSelectedLocationType(isElement ? 'element' : 'group');
                    }}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir un lieu" /></SelectTrigger>
                      <SelectContent>
                        {orgLocations.groups.length > 0 && (
                          <>
                            <SelectItem value="__group_header" disabled className="text-xs font-bold text-muted-foreground">Groupements</SelectItem>
                            {orgLocations.groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                          </>
                        )}
                        {orgLocations.elements.length > 0 && (
                          <>
                            <SelectItem value="__element_header" disabled className="text-xs font-bold text-muted-foreground">Éléments</SelectItem>
                            {orgLocations.elements.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => { setLocationMode('free'); setSelectedLocationId(''); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Je ne trouve pas le bon lieu
                    </button>
                  </div>
                )}

                {locationMode === 'free' && (
                  <div className="space-y-1 mt-2">
                    <Input
                      value={freeLocation}
                      onChange={e => setFreeLocation(e.target.value)}
                      placeholder="Décrivez le lieu..."
                    />
                    <button
                      type="button"
                      onClick={() => { setLocationMode('here'); setFreeLocation(''); }}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      ← Revenir au lieu du QR code
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* G) Title preview */}
            {actionId && (categoryId || showFreeCategory) && (objectId || showFreeObject) && (
              <div className="rounded-md bg-muted p-3">
                <Label className="text-xs text-muted-foreground">Titre du ticket (auto-généré)</Label>
                <p className="mt-1 text-sm font-mono">{buildTitle()}</p>
              </div>
            )}
          </TicketFormStep>
        )}

        {/* ============ ÉTAPE 3 : DÉTAILS & MÉDIAS ============ */}
        {step === 3 && (
          <TicketFormStep title="Étape 3 — Détails & Médias">
            {/* Duplicates detection */}
            {duplicates.length > 0 && !duplicatesDismissed && (
              <div className="space-y-3 border-2 border-destructive/30 rounded-lg p-4 bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                  <Info className="h-4 w-4" />
                  Des tickets similaires existent déjà
                </div>
                {duplicates.map(d => (
                  <div key={d.id} className="border rounded-md p-3 bg-background space-y-2">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{d.status}</Badge>
                      <span>{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {d.follower_count} suiveur{d.follower_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleFollowTicket(d.id)} className="text-xs">
                        Rejoindre ce ticket
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDuplicatesDismissed(true)} className="text-xs">
                        Non, c'est différent
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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

            {/* Upload */}
            <div className="space-y-3">
              <Label>Pièces jointes</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={startCameraCapture} disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all min-h-[80px]">
                  <Camera className="h-6 w-6 text-primary" /><span className="text-sm font-medium">Photo</span>
                </button>
                <label htmlFor="upload-video"
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all min-h-[80px] cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Video className="h-6 w-6 text-primary" /><span className="text-sm font-medium">Vidéo</span>
                </label>
                <input id="upload-video" type="file" accept="video/*" className="hidden" disabled={uploading} onChange={e => handleFileUpload(e, 'video')} />
                <button type="button" onClick={toggleAudioRecording} disabled={uploading}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[80px] ${recordingAudio ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`}>
                  <Mic className="h-6 w-6 text-primary" /><span className="text-sm font-medium">{recordingAudio ? 'Stop audio' : 'Audio'}</span>
                </button>
                <input id="upload-audio-fallback" type="file" accept="audio/*" className="hidden" disabled={uploading} onChange={e => handleFileUpload(e, 'audio')} />
                <label htmlFor="upload-doc"
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all min-h-[80px] cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <FileText className="h-6 w-6 text-primary" /><span className="text-sm font-medium">Document</span>
                </label>
                <input id="upload-doc" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" disabled={uploading} onChange={e => handleFileUpload(e, 'document')} />
              </div>

              {cameraOpen && (
                <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                  <video ref={cameraVideoRef} autoPlay playsInline muted className="w-full rounded-md border border-border bg-muted" />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={stopCameraStream}>Annuler</Button>
                    <Button type="button" onClick={capturePhoto}>Capturer</Button>
                  </div>
                </div>
              )}
              {recordingAudio && <p className="text-xs text-muted-foreground">Enregistrement en cours… cliquez Audio pour arrêter.</p>}
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

            {/* Signature */}
            {actionKey === 'verifier' && (
              <div className="space-y-2">
                <Label>Signature numérique (obligatoire)</Label>
                <SignaturePad value={signatureDataUrl} onChange={setSignatureDataUrl} />
              </div>
            )}

            {/* Notifications */}
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
                <div className="flex items-center gap-2 opacity-50">
                  <RadioGroupItem value="app" id="n-app" disabled />
                  <Label htmlFor="n-app" className="font-normal">Application</Label>
                  <Badge variant="secondary" className="text-[10px] ml-1">Bientôt disponible</Badge>
                </div>
                {notifChannel === 'app' && (
                  <p className="text-xs text-muted-foreground ml-6">
                    L'app arrive bientôt, vous serez notifié par email au lancement.
                  </p>
                )}
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
            <Button type="button" onClick={() => goToStep(step + 1)} disabled={!canProceed()} className="min-h-[44px]">
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
