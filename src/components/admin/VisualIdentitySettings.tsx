import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OrgLogo } from '@/components/ui/org-logo';
import { Palette, Upload, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';

export const VisualIdentitySettings = () => {
  const { selectedOrganization, setSelectedOrganization, organizations } = useOrganization();
  const [primaryColor, setPrimaryColor] = useState('#1e293b');
  const [secondaryColor, setSecondaryColor] = useState('#f1f5f9');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedOrganization) {
      const org = selectedOrganization as any;
      setPrimaryColor(org.primary_color || '#1e293b');
      setSecondaryColor(org.secondary_color || '#f1f5f9');
      setLogoPreview(org.logo_url || null);
    }
  }, [selectedOrganization]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le logo ne doit pas dépasser 2 Mo');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedOrganization) return;
    setSaving(true);

    try {
      let logoUrl = (selectedOrganization as any).logo_url || null;

      // Upload logo if changed
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `org-logos/${selectedOrganization.id}/logo.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(path, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(path);
        
        logoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
        } as any)
        .eq('id', selectedOrganization.id);

      if (error) throw error;

      // Update context with new values
      const updatedOrg = {
        ...selectedOrganization,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl,
      };
      setSelectedOrganization(updatedOrg as any);

      toast.success('Identité visuelle mise à jour');
      setLogoFile(null);
    } catch (error: any) {
      console.error('Error saving visual identity:', error);
      toast.error('Erreur lors de la sauvegarde : ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrimaryColor('#1e293b');
    setSecondaryColor('#f1f5f9');
    setLogoPreview(null);
    setLogoFile(null);
  };

  if (!selectedOrganization) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Sélectionnez une organisation pour configurer son identité visuelle.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Identité Visuelle
        </h3>
        <p className="text-muted-foreground">
          Personnalisez l'apparence de la plateforme pour {selectedOrganization.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Couleurs</CardTitle>
            <CardDescription>
              Définissez les couleurs de votre marque. Elles seront appliquées aux boutons, bordures actives et badges.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Couleur principale</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primary-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 rounded-md border border-input cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#1e293b"
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <div 
                  className="h-8 flex-1 rounded-md flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: primaryColor, color: '#fff' }}
                >
                  Bouton principal
                </div>
                <div 
                  className="h-8 flex-1 rounded-md border-2 flex items-center justify-center text-xs font-medium"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Bordure active
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Couleur secondaire</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="secondary-color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 rounded-md border border-input cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#f1f5f9"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              Uploadez le logo de votre organisation (PNG, JPG, SVG — max 2 Mo)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Aperçu du logo"
                    className="h-20 w-20 rounded-lg object-contain border border-border bg-background p-1"
                  />
                ) : (
                  <OrgLogo size="lg" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="logo-upload">Fichier logo</Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border">
              <p className="text-xs text-muted-foreground">
                💡 Le logo sera affiché dans la navigation et les en-têtes. 
                Utilisez de préférence un format carré ou horizontal avec fond transparent.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
};
