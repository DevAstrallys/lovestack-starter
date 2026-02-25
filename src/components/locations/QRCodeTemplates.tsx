import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { getBaseUrl } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Download, Edit, Eye, QrCode, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface Template {
  id: string;
  name: string;
  format: 'A4' | 'A5' | 'A6' | 'A7';
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  emergencyNumbers: string;
  footerText: string;
  linkedQRCodeId?: string | null;
  customCSS?: string;
}

interface QRCodeItem {
  id: string;
  display_label: string | null;
  target_slug: string | null;
  is_active: boolean;
  location_name?: string | null;
  location_type?: string | null;
}

interface QRCodeTemplatesProps {
  organizationId: string;
  qrCodes?: QRCodeItem[];
  /** When set, opens directly in download mode for a specific QR + template */
  initialQRCodeId?: string | null;
  onClose?: () => void;
}

const defaultTemplates: Template[] = [
  {
    id: 'default-signalement',
    name: 'Signalement Standard',
    format: 'A4',
    title: 'JE SIGNALE',
    description: 'JE CONSTATE UN DÉSORDRE, UN DYSFONCTIONNEMENT OU UN SINISTRE',
    primaryColor: '#FFD700',
    secondaryColor: '#000000',
    emergencyNumbers: 'SAMU: 15\nPOMPIER: 18\nPOLICE: 17\nURGENCE SMS: 114',
    footerText: 'Un souci avec le QR Code ? Contactez-nous !',
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    format: 'A5',
    title: 'MAINTENANCE',
    description: 'SIGNALEZ UN PROBLÈME TECHNIQUE',
    primaryColor: '#2563EB',
    secondaryColor: '#FFFFFF',
    emergencyNumbers: 'MAINTENANCE: 01 23 45 67 89\nURGENCE: 06 12 34 56 78',
    footerText: 'Service Maintenance - Disponible 24h/24',
  }
];

export function QRCodeTemplates({ organizationId, qrCodes = [], initialQRCodeId, onClose }: QRCodeTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewQRCode, setPreviewQRCode] = useState<string>('');
  const [selectedQRCodeId, setSelectedQRCodeId] = useState<string>(initialQRCodeId || '');
  const [baseUrl, setBaseUrl] = useState<string>('');

  // Sync when initialQRCodeId prop changes (e.g. user clicks "Template" on a QR code)
  useEffect(() => {
    if (initialQRCodeId) {
      setSelectedQRCodeId(initialQRCodeId);
    }
  }, [initialQRCodeId]);
  
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    format: 'A4',
    title: '',
    description: '',
    primaryColor: '#FFD700',
    secondaryColor: '#000000',
    emergencyNumbers: '',
    footerText: ''
  });

  const { toast } = useToast();

  const formatSizes = {
    A4: { width: 210, height: 297, pixels: { width: 794, height: 1123 } },
    A5: { width: 148, height: 210, pixels: { width: 559, height: 794 } },
    A6: { width: 105, height: 148, pixels: { width: 397, height: 559 } },
    A7: { width: 74, height: 105, pixels: { width: 280, height: 397 } }
  };

  const getEffectiveBaseUrl = (): string => {
    if (baseUrl.trim()) return baseUrl.trim().replace(/\/$/, '');
    return getBaseUrl();
  };

  const getQRCodeURL = (qrCodeId?: string): string => {
    const qr = qrCodes.find(q => q.id === qrCodeId);
    if (qr?.target_slug) {
      return `${getEffectiveBaseUrl()}/ticket-form/${qr.target_slug}`;
    }
    return `${getEffectiveBaseUrl()}/qr/sample`;
  };

  const getSelectedQRLabel = (qrCodeId?: string): string | null => {
    const qr = qrCodes.find(q => q.id === qrCodeId);
    return qr ? (qr.display_label || qr.location_name || 'QR Code') : null;
  };

  const generateQRCode = async (url: string): Promise<string> => {
    try {
      return await QRCodeLib.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.title) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    const template: Template = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name!,
      format: newTemplate.format as 'A4' | 'A5' | 'A6' | 'A7',
      title: newTemplate.title!,
      description: newTemplate.description || '',
      primaryColor: newTemplate.primaryColor || '#FFD700',
      secondaryColor: newTemplate.secondaryColor || '#000000',
      emergencyNumbers: newTemplate.emergencyNumbers || '',
      footerText: newTemplate.footerText || ''
    };

    setTemplates(prev => [...prev, template]);
    setIsCreateDialogOpen(false);
    setNewTemplate({
      name: '',
      format: 'A4',
      title: '',
      description: '',
      primaryColor: '#FFD700',
      secondaryColor: '#000000',
      emergencyNumbers: '',
      footerText: ''
    });

    toast({
      title: 'Template créé',
      description: 'Le template a été créé avec succès'
    });
  };

  const handlePreview = async (template: Template, qrCodeId?: string) => {
    setPreviewTemplate(template);
    const qrId = qrCodeId || selectedQRCodeId;
    setSelectedQRCodeId(qrId);
    const url = getQRCodeURL(qrId);
    const qrCode = await generateQRCode(url);
    setPreviewQRCode(qrCode);
    setIsPreviewOpen(true);
  };

  const handleDownloadPDF = async (template: Template, qrCodeId?: string) => {
    try {
      const qrId = qrCodeId || selectedQRCodeId;
      const url = getQRCodeURL(qrId);
      const qrCodeDataURL = await generateQRCode(url);
      
      const format = formatSizes[template.format];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [format.width, format.height]
      });

      const templateHTML = createTemplateHTML(template, qrCodeDataURL);
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = templateHTML;
      tempDiv.style.width = `${format.pixels.width}px`;
      tempDiv.style.height = `${format.pixels.height}px`;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        width: format.pixels.width,
        height: format.pixels.height,
        scale: 2
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, format.width, format.height);

      const qrLabel = getSelectedQRLabel(qrId);
      const fileName = qrLabel
        ? `template-${template.name.toLowerCase().replace(/\s+/g, '-')}-${qrLabel.toLowerCase().replace(/\s+/g, '-')}-${template.format}.pdf`
        : `template-${template.name.toLowerCase().replace(/\s+/g, '-')}-${template.format}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'PDF généré',
        description: 'Le template PDF a été téléchargé avec succès'
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le PDF',
        variant: 'destructive'
      });
    }
  };

  const createTemplateHTML = (template: Template, qrCodeDataURL: string): string => {
    return `
      <div style="
        width: 100%;
        height: 100%;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        background: white;
        position: relative;
      ">
        <!-- Header -->
        <div style="
          background: ${template.secondaryColor};
          color: white;
          padding: 20px;
          text-align: center;
        ">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">
            Votre immeuble est géré par
          </h1>
          <h2 style="margin: 10px 0 0 0; font-size: 18px;">
            GESTION IMMOBILIÈRE
          </h2>
        </div>

        <!-- Main Content -->
        <div style="
          background: ${template.primaryColor};
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        ">
          <div>
            <h1 style="
              font-size: 48px;
              font-weight: bold;
              margin: 0 0 20px 0;
              color: ${template.secondaryColor};
            ">${template.title}</h1>
            
            <p style="
              font-size: 18px;
              margin: 0 0 40px 0;
              color: ${template.secondaryColor};
              font-weight: bold;
            ">${template.description}</p>

            <div style="display: flex; align-items: center; justify-content: center; gap: 30px;">
              <img src="${qrCodeDataURL}" style="width: 150px; height: 150px;" />
              
              <div style="text-align: left;">
                <h3 style="
                  font-size: 24px;
                  margin: 0 0 10px 0;
                  color: ${template.secondaryColor};
                ">SCANNEZ LE QR CODE</h3>
                <h4 style="
                  font-size: 16px;
                  margin: 0 0 20px 0;
                  color: ${template.secondaryColor};
                ">ET INDIQUEZ SA RÉFÉRENCE</h4>
                <p style="
                  font-size: 14px;
                  line-height: 1.4;
                  margin: 0;
                  color: ${template.secondaryColor};
                  max-width: 200px;
                ">Vous allez effectuer un signalement auprès du gestionnaire de l'immeuble.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Emergency Section -->
        ${template.emergencyNumbers ? `
        <div style="
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
        ">
          <h3 style="
            font-size: 20px;
            margin: 0 0 15px 0;
            color: ${template.secondaryColor};
            font-weight: bold;
          ">EN CAS D'URGENCE</h3>
          <div style="
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
          ">
            ${template.emergencyNumbers.split('\n').map(line => {
              const [service, number] = line.split(':');
              return `<div style="text-align: center;">
                <span style="font-weight: bold; color: ${template.secondaryColor};">${service.trim()}</span>
                <br>
                <span style="font-size: 18px; color: #666;">${number?.trim() || ''}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="
          background: ${template.secondaryColor};
          color: white;
          padding: 15px;
          text-align: center;
        ">
          <p style="margin: 0; font-size: 14px;">${template.footerText}</p>
        </div>
      </div>
    `;
  };

  const activeQRCodes = qrCodes.filter(qr => qr.is_active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates d'Impression
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Créez et personnalisez vos templates pour l'impression des QR codes
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template_name">Nom du template *</Label>
                      <Input
                        id="template_name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Signalement Résidence A"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="template_format">Format *</Label>
                      <Select 
                        value={newTemplate.format} 
                        onValueChange={(value: 'A4' | 'A5' | 'A6' | 'A7') => 
                          setNewTemplate(prev => ({ ...prev, format: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                          <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                          <SelectItem value="A6">A6 (105×148mm)</SelectItem>
                          <SelectItem value="A7">A7 (74×105mm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template_title">Titre principal *</Label>
                    <Input
                      id="template_title"
                      value={newTemplate.title}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: JE SIGNALE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template_description">Description</Label>
                    <Textarea
                      id="template_description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ex: JE CONSTATE UN DÉSORDRE, UN DYSFONCTIONNEMENT OU UN SINISTRE"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Couleur principale</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={newTemplate.primaryColor}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={newTemplate.primaryColor}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#FFD700"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Couleur secondaire</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={newTemplate.secondaryColor}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={newTemplate.secondaryColor}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_numbers">Numéros d'urgence</Label>
                    <Textarea
                      id="emergency_numbers"
                      value={newTemplate.emergencyNumbers}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, emergencyNumbers: e.target.value }))}
                      placeholder="SAMU: 15&#10;POMPIER: 18&#10;POLICE: 17"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: SERVICE: NUMERO (un par ligne)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Texte de pied de page</Label>
                    <Input
                      id="footer_text"
                      value={newTemplate.footerText}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, footerText: e.target.value }))}
                      placeholder="Ex: Un souci avec le QR Code ? Contactez-nous !"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateTemplate}>
                      Créer Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* QR Code selector */}
          {activeQRCodes.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-semibold">QR Code à intégrer dans le template</Label>
                </div>
                <Select
                  value={selectedQRCodeId || '__none__'}
                  onValueChange={(value) => setSelectedQRCodeId(value === '__none__' ? '' : value)}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Sélectionner un QR Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucun (aperçu avec QR exemple)</SelectItem>
                    {activeQRCodes.map(qr => (
                      <SelectItem key={qr.id} value={qr.id}>
                        <div className="flex items-center gap-2">
                          <QrCode className="h-3 w-3" />
                          {qr.display_label || qr.location_name || 'QR Code'}
                          {qr.location_type && (
                            <span className="text-muted-foreground text-xs">({qr.location_type})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedQRCodeId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Le QR code sélectionné sera intégré dans l'aperçu et le PDF téléchargé.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URL de base (pour le QR code scanné)
                </Label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={`${getBaseUrl()} (par défaut)`}
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  Publiez votre app puis collez ici l'URL publiée pour que les QR codes fonctionnent une fois scannés.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {template.format}
                      </Badge>
                    </div>
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: template.primaryColor }}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Titre:</strong> {template.title}</p>
                    {template.description && (
                      <p><strong>Description:</strong> {template.description.substring(0, 50)}...</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Aperçu
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadPDF(template)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Aperçu - {previewTemplate?.name}
              {selectedQRCodeId && (
                <Badge variant="secondary" className="ml-2">
                  <QrCode className="h-3 w-3 mr-1" />
                  {getSelectedQRLabel(selectedQRCodeId)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* QR Code selector in preview */}
          {activeQRCodes.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Label className="text-sm whitespace-nowrap">QR Code :</Label>
              <Select
                value={selectedQRCodeId || '__none__'}
                onValueChange={async (value) => {
                  const qrId = value === '__none__' ? '' : value;
                  setSelectedQRCodeId(qrId);
                  if (previewTemplate) {
                    const url = getQRCodeURL(qrId);
                    const qr = await generateQRCode(url);
                    setPreviewQRCode(qr);
                  }
                }}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Sélectionner un QR Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">QR Code exemple</SelectItem>
                  {activeQRCodes.map(qr => (
                    <SelectItem key={qr.id} value={qr.id}>
                      {qr.display_label || qr.location_name || 'QR Code'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {previewTemplate && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div 
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(createTemplateHTML(previewTemplate, previewQRCode))
                }}
                style={{
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  width: '200%',
                  height: formatSizes[previewTemplate.format].pixels.height * 0.5
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fermer
            </Button>
            {previewTemplate && (
              <Button onClick={() => handleDownloadPDF(previewTemplate)}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
