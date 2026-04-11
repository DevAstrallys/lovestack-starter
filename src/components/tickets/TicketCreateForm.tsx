/**
 * /src/components/tickets/TicketCreateForm.tsx
 *
 * INTERNAL ticket form — used from the dashboard by connected users.
 * Orchestrates shared components and adds dashboard-specific logic:
 * - Location hierarchy: ensemble → group → element (cascading selects)
 * - Uses useTaxonomy hook (with location overrides)
 * - Detail level (4th taxonomy level)
 * - onSuccess callback
 * - Creates ticket via service layer
 *
 * REFACTORED: from 912 lines to ~220 lines by extracting shared logic.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTaxonomy } from '@/hooks/useTaxonomy';
import DOMPurify from 'dompurify';
import { createLogger } from '@/lib/logger';

import {
  StepProfile, StepDiagnostic, StepMedia,
  FormNavigation, FormNavigationButtons,
  useMediaCapture, useTaxonomySelection,
} from '@/components/tickets/shared';

import { createTicket } from '@/services/tickets';
import { fetchProfileSummary } from '@/services/users';
import {
  fetchEnsemblesWithRelations,
  fetchGroupsByOrganization,
  fetchElementsByOrganization,
} from '@/services/locations';

const log = createLogger('component:ticketCreateForm');

interface TicketCreateFormProps {
  onSuccess?: () => void;
}

export const TicketCreateForm = ({ onSuccess }: TicketCreateFormProps) => {
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();
  const { toast } = useToast();

  // --- Shared hooks ---
  const media = useMediaCapture();
  const tax = useTaxonomySelection();

  // --- Taxonomy (with overrides) ---
  const { actions, getFilteredCategories, getFilteredObjects, getFilteredDetails, loading: taxLoading } = useTaxonomy();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // --- Profile ---
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // --- Location hierarchy ---
  const [ensembles, setEnsembles] = useState<Array<{ id: string; name: string }>>([]);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [elements, setElements] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEnsembleId, setSelectedEnsembleId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedElementId, setSelectedElementId] = useState('');

  // --- Media & details ---
  const [description, setDescription] = useState('');
  const [notifChannel, setNotifChannel] = useState<'email' | 'sms' | 'app' | 'none'>('email');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // ── Derived taxonomy data ─────────────────────────────────────────
  const uniqueActions = useMemo(() => {
    const seen = new Set<string>();
    return actions.filter((a) => {
      const k = (a.key || '').trim().toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [actions]);

  const filteredCategories = tax.actionId ? getFilteredCategories(tax.actionId) : [];
  const filteredObjects = tax.categoryId ? getFilteredObjects(tax.categoryId) : [];
  const filteredDetails = tax.objectId ? getFilteredDetails(tax.objectId) : [];

  // ── Auto-fill profile ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const prof = await fetchProfileSummary(user.id);
      if (prof) {
        const parts = (prof.full_name || '').split(' ');
        setLastName(parts[0] || '');
        setFirstName(parts.slice(1).join(' ') || '');
        setPhone(prof.phone || '');
      }
      setEmail(user.email || '');
    })();
  }, [user]);

  // ── Load location hierarchy ───────────────────────────────────────
  useEffect(() => {
    if (!selectedOrganization) return;
    (async () => {
      const data = await fetchEnsemblesWithRelations(selectedOrganization.id);
      setEnsembles((data || []).map((e: Record<string, unknown>) => ({ id: e.id as string, name: e.name as string })));
    })();
  }, [selectedOrganization]);

  useEffect(() => {
    if (!selectedEnsembleId) { setGroups([]); return; }
    (async () => {
      const data = await fetchGroupsByOrganization(selectedEnsembleId);
      setGroups((data || []).map((g: Record<string, unknown>) => ({ id: g.id as string, name: g.name as string })));
    })();
  }, [selectedEnsembleId]);

  useEffect(() => {
    if (!selectedGroupId) { setElements([]); return; }
    (async () => {
      const data = await fetchElementsByOrganization(selectedGroupId);
      setElements((data || []).map((el: Record<string, unknown>) => ({ id: el.id as string, name: el.name as string })));
    })();
  }, [selectedGroupId]);

  // ── Validation ────────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return !!(lastName && firstName && profileRole);
    if (step === 2) return !!(tax.actionId && tax.categoryId && (tax.objectId || (tax.showFreeObject && tax.freeObject.trim())) && tax.urgency > 0);
    if (step === 3) return !!description.trim() && (tax.actionKey !== 'verifier' || !!signatureDataUrl);
    return false;
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canProceed() || !user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' });
      return;
    }

    const title = DOMPurify.sanitize(tax.buildTitle());
    const desc = DOMPurify.sanitize(description);
    const priority = tax.urgency === 4 ? 'urgent' : tax.urgency === 3 ? 'high' : tax.urgency === 2 ? 'medium' : 'low';

    const locationName = elements.find(e => e.id === selectedElementId)?.name
      || groups.find(g => g.id === selectedGroupId)?.name
      || ensembles.find(e => e.id === selectedEnsembleId)?.name
      || null;

    const ticketData: Record<string, unknown> = {
      title, description: desc, priority, status: 'open',
      created_by: user.id,
      organization_id: selectedOrganization?.id || null,
      source: 'dashboard', initiality: tax.initiality,
      action_code: tax.actionId || null,
      category_id: tax.categoryId || null,
      object_id: tax.showFreeObject ? null : (tax.objectId || null),
      reporter_name: DOMPurify.sanitize(`${lastName} ${firstName}`.trim()),
      reporter_email: email || null,
      reporter_phone: phone || null,
      location: {
        element_id: selectedElementId || null,
        group_id: selectedGroupId || null,
        ensemble_id: selectedEnsembleId || null,
        name: locationName,
      },
      attachments: media.uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type, storage_path: f.storagePath })),
      meta: {
        reporter_role: profileRole, urgency_level: tax.urgency,
        notification_channel: notifChannel,
        signature: tax.actionKey === 'verifier' ? signatureDataUrl : null,
        action_id: tax.actionId, action_key: tax.actionKey, action_label: tax.actionLabel,
        category_label: tax.categoryLabel,
        object_label: tax.showFreeObject ? tax.freeObject : tax.objectLabel,
        detail_id: tax.detailId || null, detail_label: tax.detailLabel || null,
        ...(tax.showFreeObject ? { free_object: tax.freeObject } : {}),
      },
    };

    try {
      setSubmitting(true);
      await createTicket(ticketData);
      toast({ title: 'Ticket créé avec succès !' });
      onSuccess?.();
    } catch (err) {
      log.error('Ticket creation failed', { error: err });
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Impossible de créer le ticket', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (taxLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <FormNavigation step={step} canProceed={canProceed()} submitting={submitting} onPrevious={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onSubmit={handleSubmit} />

      {step === 1 && (
        <StepProfile
          lastName={lastName} firstName={firstName} profileRole={profileRole} phone={phone} email={email}
          onLastNameChange={setLastName} onFirstNameChange={setFirstName} onRoleChange={setProfileRole}
          onPhoneChange={setPhone} onEmailChange={setEmail}
        >
          {/* Location hierarchy (dashboard-specific) */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <Label className="text-base font-semibold">Localisation</Label>
            {selectedOrganization && <p className="text-xs text-muted-foreground">Organisation : {selectedOrganization.name}</p>}
            <div className="space-y-2">
              <Label>Ensemble (Copropriété)</Label>
              <Select value={selectedEnsembleId || undefined} onValueChange={v => { setSelectedEnsembleId(v); setSelectedGroupId(''); setSelectedElementId(''); }}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner un ensemble" /></SelectTrigger>
                <SelectContent>{ensembles.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedEnsembleId && groups.length > 0 && (
              <div className="space-y-2">
                <Label>Groupement (Bâtiment)</Label>
                <Select value={selectedGroupId || undefined} onValueChange={v => { setSelectedGroupId(v); setSelectedElementId(''); }}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner un groupement" /></SelectTrigger>
                  <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {selectedGroupId && elements.length > 0 && (
              <div className="space-y-2">
                <Label>Élément (Appartement / Local)</Label>
                <Select value={selectedElementId || undefined} onValueChange={setSelectedElementId}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner un élément" /></SelectTrigger>
                  <SelectContent>{elements.map(el => <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        </StepProfile>
      )}

      {step === 2 && (
        <StepDiagnostic
          taxonomy={tax}
          actions={uniqueActions}
          categories={filteredCategories}
          objects={filteredObjects as Array<import('@/types').TaxObject>}
          details={filteredDetails as Array<import('@/types').TaxDetail>}
          showFreeCategoryOption={false}
        />
      )}

      {step === 3 && (
        <StepMedia
          description={description} onDescriptionChange={setDescription}
          notifChannel={notifChannel} onNotifChannelChange={setNotifChannel}
          signatureDataUrl={signatureDataUrl} onSignatureChange={setSignatureDataUrl}
          requireSignature={tax.actionKey === 'verifier'}
          {...media}
        />
      )}

      <FormNavigationButtons step={step} canProceed={canProceed()} submitting={submitting} onPrevious={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onSubmit={handleSubmit} />
    </div>
  );
};
