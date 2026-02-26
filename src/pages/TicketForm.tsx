import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { closeCurrentView } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, QrCode, ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTaxonomy } from '@/hooks/useTaxonomy';
import { UploadedFile } from '@/components/tickets/MediaUpload';
import { ReportStepProfile, ProfileData } from '@/components/report/ReportStepProfile';
import { ReportStepDiagnostic, DiagnosticData } from '@/components/report/ReportStepDiagnostic';
import { ReportStepMedia, MediaData } from '@/components/report/ReportStepMedia';
import { AdBanner } from '@/components/report/AdBanner';
import DOMPurify from 'dompurify';

const TOTAL_STEPS = 3;

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

  const { actions, getFilteredCategories, getFilteredObjects, getFilteredDetails, loading: taxLoading } = useTaxonomy();

  const [profile, setProfile] = useState<ProfileData>({
    first_name: '', last_name: '', role: '', phone: '', email: ''
  });

  const [diagnostic, setDiagnostic] = useState<DiagnosticData>({
    action_id: '', action_key: '', action_label: '',
    category_id: '', category_label: '',
    object_id: '', object_label: '',
    detail_id: '', detail_label: '',
    urgency: 2,
    initiality: 'initial',
  });

  const [media, setMedia] = useState<MediaData>({ description: '', notification_channel: 'email' });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Load QR code and check premium
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

        // Fetch location names separately
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

        // Check premium
        if (data.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('is_premium')
            .eq('id', data.organization_id)
            .single();
          setIsPremium(org?.is_premium ?? false);
        }

        // Pre-fill from form_config
        if (data.form_config && typeof data.form_config === 'object' && data.form_config !== null) {
          const config = data.form_config as Record<string, string>;
          if (config.action) setDiagnostic(prev => ({ ...prev, action_key: config.action || '' }));
        }
      } catch (err) {
        console.error('Error loading QR code:', err);
        toast({ title: 'Erreur', description: 'Impossible de charger les informations du QR Code', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, toast]);

  // Auto-fill profile if logged in
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
    const axe = diagnostic.action_key.toUpperCase();
    let title = `[${init}] [${axe}] ${diagnostic.category_label} > ${diagnostic.object_label}`;
    if (diagnostic.detail_label) title += ` : ${diagnostic.detail_label}`;
    return title;
  };

  const canProceed = () => {
    if (step === 1) return profile.last_name && profile.first_name && profile.role;
    if (step === 2) return diagnostic.action_id && diagnostic.category_id && diagnostic.object_id && diagnostic.urgency > 0;
    if (step === 3) {
      if (!media.description.trim()) return false;
      if (diagnostic.action_key === 'verifier' && !signatureDataUrl) return false;
      return true;
    }
    return false;
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
        action_code: diagnostic.action_key || null,
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
          action_label: diagnostic.action_label,
          category_label: diagnostic.category_label,
          object_label: diagnostic.object_label,
        },
      };

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
            <Button onClick={() => closeCurrentView(navigate)} className="min-h-[44px] active:scale-95 transition-transform">
              Fermer
            </Button>
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
          <ReportStepDiagnostic
            data={diagnostic}
            onChange={setDiagnostic}
            actions={actions}
            getFilteredCategories={getFilteredCategories}
            getFilteredObjects={getFilteredObjects}
            getFilteredDetails={getFilteredDetails}
          />
        )}
        {step === 3 && (
          <ReportStepMedia
            data={media}
            onChange={setMedia}
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            showSignature={diagnostic.action_key === 'verifier'}
            signatureDataUrl={signatureDataUrl}
            onSignatureChange={setSignatureDataUrl}
          />
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="min-h-[44px] active:scale-95 transition-transform">
              <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
            </Button>
          )}
          <div className="flex-1" />
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="min-h-[44px] active:scale-95 transition-transform"
            >
              Suivant <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="min-h-[44px] active:scale-95 transition-transform"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              {submitting ? 'Envoi...' : 'Créer le ticket'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
