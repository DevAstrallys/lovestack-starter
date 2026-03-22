import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User, Download, Trash2, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { fetchProfile, updateProfile, invokeRgpd } from '@/services/users';
import { signOut } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null; locale: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id)
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { full_name: profile.full_name, phone: profile.phone });
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await invokeRgpd('export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Données exportées');
    } catch (err: any) {
      toast.error('Erreur : ' + (err.message || 'Erreur inconnue'));
    } finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await invokeRgpd('delete');
      toast.success('Votre compte a été supprimé.');
      await signOut();
      navigate('/');
    } catch (err: any) {
      toast.error('Erreur : ' + (err.message || 'Erreur inconnue'));
    } finally { setDeleting(false); }
  };

  if (!user) { navigate('/'); return null; }

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Informations</CardTitle>
            <CardDescription>Email : {user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input id="fullName" value={profile?.full_name || ''} onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" value={profile?.phone || ''} onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)} />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Mes données (RGPD)</CardTitle>
            <CardDescription>Exportez l'intégralité de vos données personnelles.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Exporter (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Zone de danger</CardTitle>
            <CardDescription>Suppression irréversible de votre compte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Toutes vos données seront supprimées. Les tickets seront anonymisés.</AlertDescription>
            </Alert>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer mon compte</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suppression définitive</AlertDialogTitle>
                  <AlertDialogDescription>Tapez <strong>SUPPRIMER</strong> pour confirmer.</AlertDialogDescription>
                </AlertDialogHeader>
                <Input placeholder="SUPPRIMER" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText('')}>Annuler</AlertDialogCancel>
                  <AlertDialogAction disabled={confirmText !== 'SUPPRIMER' || deleting} onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default Profile;
