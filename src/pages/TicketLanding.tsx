import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LogIn, Zap, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';
import { getCurrentUser } from '@/services/auth';
import { signInWithEmail } from '@/services/auth';
import { fetchQrCodeBySlug, createTicket as createTicketService } from '@/services/tickets';
import { triggerNotification } from '@/services/notifications';

const log = createLogger('page:ticketLanding');

const TERRAIN_ROLES = [
  { code: 'locataire', label: 'Locataire' },
  { code: 'proprietaire', label: 'Propriétaire' },
  { code: 'proprietaire_bailleur', label: 'Propriétaire bailleur' },
  { code: 'gardien', label: 'Gardien(ne)' },
  { code: 'prestataire', label: 'Prestataire' },
  { code: 'conseil_syndical', label: 'Conseil syndical' },
];

export function TicketLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<any>(null);
  const [activePanel, setActivePanel] = useState<'choice' | 'login' | 'access'>('choice');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Access request state
  const [accessForm, setAccessForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: '', motif: '',
  });
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSubmitted, setAccessSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        // Check if already logged in
        const user = await getCurrentUser();
        if (user) {
          navigate(`/ticket-form/${slug}/form?mode=connected`, { replace: true });
          return;
        }
        // Load QR code
        const data = await fetchQrCodeBySlug(slug);
        if (!data) {
          toast({ title: 'Ce lien a expiré', description: 'Ce QR Code a été remplacé par une version plus récente. Veuillez scanner le nouveau QR Code.', variant: 'destructive' });
          return;
        }
        setQrCode(data);
      } catch (err) {
        log.error('Landing init failed', { slug, error: err });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await signInWithEmail(loginEmail, loginPassword);
      navigate(`/ticket-form/${slug}/form?mode=connected`, { replace: true });
    } catch (err: unknown) {
      log.error('Login failed', { error: err });
      toast({ title: 'Connexion échouée', description: err instanceof Error ? err.message : 'Vérifiez vos identifiants', variant: 'destructive' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessForm.firstName || !accessForm.lastName || !accessForm.email || !accessForm.role) {
      toast({ title: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return;
    }
    setAccessLoading(true);
    try {
      const ticketData = {
        title: `[DEMANDE ACCÈS] ${accessForm.lastName} ${accessForm.firstName}`,
        description: accessForm.motif || 'Demande d\'accès au bâtiment',
        status: 'open' as const,
        source: 'access_request',
        organization_id: qrCode?.organization_id || null,
        reporter_name: `${accessForm.lastName} ${accessForm.firstName}`.trim(),
        reporter_email: accessForm.email,
        reporter_phone: accessForm.phone || null,
        meta: {
          qr_code_id: qrCode?.id,
          requested_role: accessForm.role,
          motif: accessForm.motif,
          contact: { email: accessForm.email, phone: accessForm.phone },
        },
        location: {
          element_id: qrCode?.location_element_id || null,
          group_id: qrCode?.location_group_id || null,
          ensemble_id: qrCode?.location_ensemble_id || null,
        },
      };

      await createTicketService(ticketData);

      // Notify organization managers (non-blocking)
      if (qrCode?.organization_id) {
        try {
          await triggerNotification({
            type: 'access_request',
            userIds: [], // notification-engine will resolve org managers
            data: {
              organization_id: qrCode.organization_id,
              requester_name: `${accessForm.firstName} ${accessForm.lastName}`,
              requester_email: accessForm.email,
              requested_role: accessForm.role,
            },
          });
        } catch (notifErr) {
          log.warn('Access request notification failed (non-blocking)', { error: notifErr });
        }
      }

      setAccessSubmitted(true);
      log.info('Access request submitted', { orgId: qrCode?.organization_id });
    } catch (err: unknown) {
      log.error('Access request failed', { error: err });
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Impossible d\'envoyer la demande', variant: 'destructive' });
    } finally {
      setAccessLoading(false);
    }
  };

  if (loading) {
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

  if (accessSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Demande envoyée</h3>
            <p className="text-muted-foreground mb-4">
              Votre demande d'accès a été transmise au gestionnaire. Vous serez contacté par email.
            </p>
            <Button variant="outline" onClick={() => { setAccessSubmitted(false); setActivePanel('choice'); }}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const locationName = qrCode?._elName || qrCode?._grName || qrCode?._enName || '';

  // --- Login panel ---
  if (activePanel === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full min-h-[44px]" disabled={loginLoading}>
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Se connecter
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setActivePanel('choice')}>
                Retour
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Access request panel ---
  if (activePanel === 'access') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Demander un accès</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccessRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prénom *</Label>
                  <Input value={accessForm.firstName} onChange={e => setAccessForm(p => ({ ...p, firstName: e.target.value }))} required />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input value={accessForm.lastName} onChange={e => setAccessForm(p => ({ ...p, lastName: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={accessForm.email} onChange={e => setAccessForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input type="tel" value={accessForm.phone} onChange={e => setAccessForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Rôle souhaité *</Label>
                <Select value={accessForm.role} onValueChange={v => setAccessForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                  <SelectContent>
                    {TERRAIN_ROLES.map(r => (
                      <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Motif</Label>
                <Textarea value={accessForm.motif} onChange={e => setAccessForm(p => ({ ...p, motif: e.target.value }))} placeholder="Décrivez votre demande..." rows={3} />
              </div>
              <Button type="submit" className="w-full min-h-[44px]" disabled={accessLoading}>
                {accessLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Envoyer la demande
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setActivePanel('choice')}>
                Retour
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main choice screen ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        {locationName && (
          <p className="text-center text-sm text-muted-foreground">{locationName}</p>
        )}
        <h1 className="text-xl font-bold text-center text-foreground">Que souhaitez-vous faire ?</h1>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActivePanel('login')}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Je me connecte</p>
              <p className="text-sm text-muted-foreground">J'ai déjà un compte</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate(`/ticket-form/${slug}/form?mode=guest`)}
        >
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Déclarer rapidement</p>
              <p className="text-sm text-muted-foreground">Sans créer de compte</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActivePanel('access')}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Demander un accès</p>
              <p className="text-sm text-muted-foreground">Obtenir un rôle sur ce lieu</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
