/**
 * /src/pages/TicketForm.tsx
 *
 * PUBLIC ticket form — accessed via QR code scan.
 * Orchestrates shared components and adds QR-specific logic:
 * - QR code slug loading + form_config filtering
 * - Premium/AdBanner display
 * - Tracking code generation (guest mode)
 * - Duplicate detection + follow ticket
 * - Location: here (QR) / other / free text
 * - Email notification on submit
 * - Success screen with tracking code
 *
 * REFACTORED: from 1245 lines to ~300 lines by extracting shared logic.
 */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { closeCurrentView } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, QrCode, Copy, ExternalLink, MapPin, Users, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdBanner } from '@/components/report/AdBanner';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'dompurify';
import { createLogger } from '@/lib/logger';

import {
  StepProfile, StepDiagnostic, StepMedia,
  FormNavigation, FormNavigationButtons,
  useMediaCapture, useTaxonomySelection,
} from '@/components/tickets/shared';

import {
  createTicket as createTicketService,
  fetchQrCodeBySlug,
  fetchOrganizationPremiumStatus,
} from '@/services/tickets';
import {
  fetchTaxActions, fetchTaxCategories, fetchTaxObjects,
  upsertTaxSuggestion, searchDuplicateTickets,
} from '@/services/taxonomy';
import { followTicket } from '@/services/tickets/followers';
import { getCurrentUser } from '@/services/auth';
import { fetchProfile } from '@/services/users';
import { sendEmail } from '@/services/notifications';
import { generateTrackingCode } from '@/services/tickets/tracking';
import { fetchOrganizationLocations } from '@/services/locations';

import type { TaxAction, TaxCategory, TaxObject, DuplicateCandidate } from '@/types';

const log = createLogger('page:ticketForm');

export function TicketForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'guest';
  const { toast } = useToast();

  // --- Shared hooks ---
  const media = useMediaCapture();
  const tax = useTaxonomySelection();

  // --- Core state ---
  const [qrCode, setQrCode] = useState<Record<string, unknown> | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketShortId, setTicketShortId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [step, setStep] = useState(1);

  // --- Taxonomy data ---
  const [actions, setActions] = useState<TaxAction[]>([]);
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [objects, setObjects] = useState<TaxObject[]>([]);
  const [taxLoading, setTaxLoading] = useState(true);

  // --- Profile ---
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // --- Media & details ---
  const [description, setDescription] = useState('');
  const [notifChannel, setNotifChannel] = useState<'email' | 'sms' | 'app' | 'none'>('email');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // --- Location ---
  const [locationMode, setLocationMode] = useState<'here' | 'other' | 'free'>('here');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<'element' | 'group'>('element');
  const [freeLocation, setFreeLocation] = useState('');
  const [orgLocations, setOrgLocations] = useState<{ elements: Array<{ id: string; name: string }>; groups: Array<{ id: string; name: string }> }>({ elements: [], groups: [] });

  // --- Duplicates ---
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [duplicatesChecked, setDuplicatesChecked] = useState(false);
  const [duplicatesDismissed, setDuplicatesDismissed] = useState(false);
  const [followFormTicketId, setFollowFormTicketId] = useState<string | null>(null);
  const [followEmail, setFollowEmail] = useState('');
  const [followPhone, setFollowPhone] = useState('');
  const [followSubmitting, setFollowSubmitting] = useState(false);

  // ── Load QR code ──────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchQrCodeBySlug(slug);
        if (!data) {
          toast({ title: 'Ce lien a expiré', description: 'Veuillez scanner le nouveau QR Code.', variant: 'destructive' });
          return;
        }
        setQrCode(data);
        if (data.organization_id) {
          const premium = await fetchOrganizationPremiumStatus(data.organization_id as string);
          setIsPremium(premium);
        }
      } catch (err) {
        log.error('Error loading QR code', { slug, error: err });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, toast]);

  // ── Parse form_config ─────────────────────────────────────────────
  const formConfig = useMemo(() => {
    const raw = qrCode?.form_config;
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    return {
      allowed_action_ids: Array.isArray(obj.allowed_action_ids) ? obj.allowed_action_ids as string[] : [],
      allowed_category_ids: Array.isArray(obj.allowed_category_ids) ? obj.allowed_category_ids as string[] : [],
      default_action_id: typeof obj.default_action_id === 'string' ? obj.default_action_id : '',
      default_urgency: typeof obj.default_urgency === 'number' ? obj.default_urgency : 0,
    };
  }, [qrCode?.form_config]);

  // ── Load taxonomy ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try { setTaxLoading(true); setActions(await fetchTaxActions()); }
      catch (err) { log.error('Failed to load actions', { error: err }); }
      finally { setTaxLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!tax.actionId) { setCategories([]); return; }
    (async () => {
      let data = await fetchTaxCategories(tax.actionId);
      if (formConfig?.allowed_category_ids.length) {
        data = data.filter(c => formConfig.allowed_category_ids.includes(c.id));
      }
      setCategories(data);
    })();
  }, [tax.actionId, formConfig]);

  useEffect(() => {
    if (!tax.categoryId) { setObjects([]); return; }
    (async () => { setObjects(await fetchTaxObjects(tax.categoryId)); })();
  }, [tax.categoryId]);

  // ── Apply form_config defaults ────────────────────────────────────
  useEffect(() => {
    if (!formConfig || actions.length === 0) return;
    if (formConfig.default_action_id && !tax.actionId) {
      const a = actions.find(x => x.id === formConfig.default_action_id);
      if (a) tax.selectAction(a);
    }
    if (formConfig.default_urgency > 0 && tax.urgency === 2) {
      tax.setUrgency(formConfig.default_urgency);
    }
  }, [formConfig, actions]);

  // ── Load org locations ────────────────────────────────────────────
  useEffect(() => {
    if (locationMode === 'other' && qrCode?.organization_id && orgLocations.elements.length === 0) {
      (async () => {
        const locs = await fetchOrganizationLocations(qrCode.organization_id as string);
        setOrgLocations(locs);
      })();
    }
  }, [locationMode, qrCode?.organization_id]);

  // ── Auto-fill profile ─────────────────────────────────────────────
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
      } catch (err) { log.debug('Auto-fill profile skipped', { error: err }); }
    })();
  }, []);

  // ── Filter actions by form_config ─────────────────────────────────
  const uniqueActions = useMemo(() => {
    const seen = new Set<string>();
    let filtered = actions.filter((a) => {
      const k = (a.key || '').trim().toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (formConfig?.allowed_action_ids.length) {
      filtered = filtered.filter(a => formConfig.allowed_action_ids.includes(a.id));
    }
    return filtered;
  }, [actions, formConfig]);

  // ── Validation ────────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return !!(lastName && firstName && profileRole);
    if (step === 2) {
      const hasCat = tax.categoryId || (tax.showFreeCategory && tax.freeCategory.trim());
      const hasObj = tax.objectId || (tax.showFreeObject && tax.freeObject.trim());
      return !!(tax.actionId && hasCat && hasObj && tax.urgency > 0);
    }
    if (step === 3) {
      if (!description.trim()) return false;
      if (tax.actionKey === 'verifier' && !signatureDataUrl) return false;
      return true;
    }
    return false;
  };

  // ── Duplicate detection ───────────────────────────────────────────
  const checkDuplicates = useCallback(async () => {
    if (!qrCode?.organization_id || !tax.categoryId || duplicatesChecked) return;
    setDuplicatesChecked(true);
    const results = await searchDuplicateTickets({
      organizationId: qrCode.organization_id as string,
      categoryId: tax.categoryId,
    });
    if (results.length > 0) setDuplicates(results);
  }, [qrCode?.organization_id, tax.categoryId, duplicatesChecked]);

  const handleFollowTicket = async (ticketId: string) => {
    const user = await getCurrentUser();
    if (user) {
      await followTicket(ticketId, user.id);
      toast({ title: 'Vous suivez ce ticket !' });
      setDuplicatesDismissed(true);
    } else {
      setFollowFormTicketId(ticketId);
      setFollowEmail(email);
      setFollowPhone(phone);
    }
  };

  const goToStep = (next: number) => {
    if (next === 3) checkDuplicates();
    setStep(next);
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canProceed()) return;
    const user = await getCurrentUser();
    const title = DOMPurify.sanitize(tax.buildTitle());
    const desc = DOMPurify.sanitize(description);
    const priority = tax.urgency === 4 ? 'urgent' : tax.urgency === 3 ? 'high' : tax.urgency === 2 ? 'medium' : 'low';
    const isGuest = mode === 'guest';
    const newTrackingCode = isGuest ? generateTrackingCode() : '';

    let locationPayload: Record<string, unknown> = {};
    if (locationMode === 'here') {
      locationPayload = {
        element_id: qrCode?.location_element_id || null,
        group_id: qrCode?.location_group_id || null,
        ensemble_id: qrCode?.location_ensemble_id || null,
      };
    } else if (locationMode === 'other' && selectedLocationId) {
      locationPayload = { [`${selectedLocationType}_id`]: selectedLocationId };
    } else if (locationMode === 'free') {
      locationPayload = { name: freeLocation };
    }

    const ticketData: Record<string, unknown> = {
      title, description: desc, priority, status: 'open',
      created_by: user?.id || null,
      building_id: qrCode?.building_id || null,
      organization_id: qrCode?.organization_id || null,
      source: 'qr_code', initiality: tax.initiality,
      action_code: tax.actionId || null,
      category_id: tax.showFreeCategory ? null : (tax.categoryId || null),
      object_id: tax.showFreeObject ? null : (tax.objectId || null),
      reporter_name: DOMPurify.sanitize(`${lastName} ${firstName}`.trim()),
      reporter_email: email || null,
      reporter_phone: phone || null,
      location: locationPayload,
      attachments: media.uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type, storage_path: f.storagePath })),
      meta: {
        qr_code_id: qrCode?.id, reporter_role: profileRole, urgency_level: tax.urgency,
        notification_channel: notifChannel === 'app' ? 'email' : notifChannel,
        signature: tax.actionKey === 'verifier' ? signatureDataUrl : null,
        action_id: tax.actionId, action_key: tax.actionKey, action_label: tax.actionLabel,
        category_label: tax.showFreeCategory ? tax.freeCategory : tax.categoryLabel,
        object_label: tax.showFreeObject ? tax.freeObject : tax.objectLabel,
        ...(tax.showFreeCategory ? { free_category: tax.freeCategory } : {}),
        ...(tax.showFreeObject ? { free_object: tax.freeObject } : {}),
        ...(locationMode === 'free' ? { free_location: freeLocation } : {}),
        ...(newTrackingCode ? { tracking_code: newTrackingCode } : {}),
      },
    };

    try {
      setSubmitting(true);
      if (tax.showFreeCategory && tax.freeCategory.trim()) {
        await upsertTaxSuggestion({ type: 'category', free_text: tax.freeCategory, context: { module: 'tickets', level: 'category', organization_id: qrCode?.organization_id as string, qr_code_id: qrCode?.id as string } });
      }
      if (tax.showFreeObject && tax.freeObject.trim()) {
        await upsertTaxSuggestion({ type: 'object', free_text: tax.freeObject, context: { module: 'tickets', level: 'object', organization_id: qrCode?.organization_id as string, qr_code_id: qrCode?.id as string }, category_id: tax.showFreeCategory ? undefined : tax.categoryId });
      }
      const ticket = await createTicketService(ticketData);
      setTicketShortId(ticket.id.substring(0, 8).toUpperCase());
      if (newTrackingCode) setTrackingCode(newTrackingCode);

      if ((notifChannel === 'email' || notifChannel === 'app') && email) {
        try {
          await sendEmail({ template: 'notification', to: [email], data: { recipientName: `${firstName} ${lastName}`.trim(), title: 'Votre signalement a été enregistré', message: newTrackingCode ? `Code de suivi : ${newTrackingCode}` : 'Vous recevrez des mises à jour par email.', ticketId: ticket.id, trackingCode: newTrackingCode || undefined } });
        } catch (notifErr) { log.warn('Confirmation email failed', { error: notifErr }); }
      }
      setSubmitted(true);
      toast({ title: 'Ticket créé avec succès !' });
    } catch (err) {
      log.error('Ticket creation failed', { error: err });
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Impossible de créer le ticket', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  // ── Render: Loading ───────────────────────────────────────────────
  if (loading || taxLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!qrCode) {
    return <div className="min-h-screen flex items-center justify-center bg-background p-4"><Card className="w-full max-w-md"><CardContent className="pt-6 text-center"><AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">QR Code invalide</h3><p className="text-muted-foreground">Ce QR Code n'existe pas ou n'est plus actif.</p></CardContent></Card></div>;
  }

  // ── Render: Success ───────────────────────────────────────────────
  if (submitted) {
    const isGuest = mode === 'guest';
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Ticket créé !</h3>
            {isGuest && trackingCode && (
              <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Votre code de suivi</p>
                <p className="text-2xl font-mono font-bold tracking-widest">{trackingCode}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={async () => { try { await navigator.clipboard.writeText(trackingCode); toast({ title: 'Code copié !' }); } catch { toast({ title: 'Impossible de copier', variant: 'destructive' }); } }}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copier le code
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {isGuest && trackingCode && slug && (
                <Button variant="default" className="w-full min-h-[44px]" onClick={() => navigate(`/suivi/${slug}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Suivre ma demande
                </Button>
              )}
              <Button variant="outline" onClick={() => closeCurrentView(navigate)} className="w-full min-h-[44px]">Fermer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const locationName = (qrCode as Record<string, unknown>)?._elName || (qrCode as Record<string, unknown>)?._grName || (qrCode as Record<string, unknown>)?._enName || 'Non défini';

  // ── Render: Form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="container mx-auto max-w-lg px-4 pt-6 space-y-4">
        {!isPremium && <AdBanner />}

        <div className="flex items-center gap-3">
          <QrCode className="h-7 w-7 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">Signalement</h1>
            <p className="text-sm text-muted-foreground truncate">{qrCode?.display_label as string}</p>
          </div>
        </div>

        <Alert><AlertCircle className="h-4 w-4" /><AlertDescription><strong>Lieu :</strong> {locationName as string}</AlertDescription></Alert>

        <FormNavigation step={step} canProceed={canProceed()} submitting={submitting} onPrevious={() => setStep(s => s - 1)} onNext={() => goToStep(step + 1)} onSubmit={handleSubmit} />

        {step === 1 && (
          <StepProfile
            lastName={lastName} firstName={firstName} profileRole={profileRole} phone={phone} email={email}
            onLastNameChange={setLastName} onFirstNameChange={setFirstName} onRoleChange={setProfileRole}
            onPhoneChange={setPhone} onEmailChange={setEmail}
          />
        )}

        {step === 2 && (
          <StepDiagnostic
            taxonomy={tax} actions={uniqueActions} categories={categories} objects={objects}
            showFreeCategoryOption={true}
          >
            {/* Location selector (QR-specific) */}
            {tax.actionId && (
              <div className="space-y-2">
                <Label>Localisation</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setLocationMode('here'); setFreeLocation(''); setSelectedLocationId(''); }}
                    className={`p-3 rounded-lg border-2 text-sm font-medium min-h-[44px] flex items-center gap-2 justify-center ${locationMode === 'here' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <MapPin className="h-4 w-4" /> Ici (QR code)
                  </button>
                  <button type="button" onClick={() => setLocationMode('other')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium min-h-[44px] ${locationMode === 'other' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    Autre endroit
                  </button>
                </div>
                {locationMode === 'other' && (
                  <div className="space-y-2 mt-2">
                    <Select value={selectedLocationId || undefined} onValueChange={(val) => {
                      const isElement = orgLocations.elements.some(e => e.id === val);
                      setSelectedLocationId(val); setSelectedLocationType(isElement ? 'element' : 'group');
                    }}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir un lieu" /></SelectTrigger>
                      <SelectContent>
                        {orgLocations.groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        {orgLocations.elements.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button type="button" onClick={() => { setLocationMode('free'); setSelectedLocationId(''); }} className="text-xs text-primary hover:underline">Je ne trouve pas le bon lieu</button>
                  </div>
                )}
                {locationMode === 'free' && (
                  <div className="space-y-1 mt-2">
                    <Input value={freeLocation} onChange={e => setFreeLocation(e.target.value)} placeholder="Décrivez le lieu..." />
                    <button type="button" onClick={() => { setLocationMode('here'); setFreeLocation(''); }} className="text-xs text-muted-foreground hover:underline">← Revenir au lieu du QR code</button>
                  </div>
                )}
              </div>
            )}
          </StepDiagnostic>
        )}

        {step === 3 && (
          <StepMedia
            description={description} onDescriptionChange={setDescription}
            notifChannel={notifChannel} onNotifChannelChange={setNotifChannel}
            signatureDataUrl={signatureDataUrl} onSignatureChange={setSignatureDataUrl}
            requireSignature={tax.actionKey === 'verifier'}
            showAppNotifOption={true}
            {...media}
          >
            {/* Duplicate detection (QR-specific) */}
            {duplicates.length > 0 && !duplicatesDismissed && (
              <div className="space-y-3 border-2 border-destructive/30 rounded-lg p-4 bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                  <Info className="h-4 w-4" /> Des tickets similaires existent déjà
                </div>
                {duplicates.map(d => (
                  <div key={d.id} className="border rounded-md p-3 bg-background space-y-2">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{d.status}</Badge>
                      <span>{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleFollowTicket(d.id)} className="text-xs">Rejoindre ce ticket</Button>
                      <Button size="sm" variant="outline" onClick={() => setDuplicatesDismissed(true)} className="text-xs">Non, c'est différent</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StepMedia>
        )}

        <FormNavigationButtons step={step} canProceed={canProceed()} submitting={submitting} onPrevious={() => setStep(s => s - 1)} onNext={() => goToStep(step + 1)} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
