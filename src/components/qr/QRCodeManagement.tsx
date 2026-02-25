import React, { useState } from 'react';
import { getBaseUrl } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Calendar,
  Hash,
  MapPin,
  Plus,
  Download
} from 'lucide-react';
import { useQRCodes, QRCode } from '@/hooks/useQRCodes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QRCodeManagementProps {
  locationElementId?: string;
  buildingId?: string;
  locationName?: string;
}

export function QRCodeManagement({ locationElementId, buildingId, locationName }: QRCodeManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newQRData, setNewQRData] = useState({
    display_label: '',
    target_slug: ''
  });

  const { qrCodes, activeQR, loading, createQRCode, regenerateQRCode, deactivateQRCode } = useQRCodes(
    locationElementId,
    buildingId
  );
  
  const { toast } = useToast();

  const handleCreateQR = async () => {
    try {
      await createQRCode({
        location_element_id: locationElementId || null,
        building_id: buildingId || null,
        display_label: newQRData.display_label || locationName || 'QR Code',
        target_slug: newQRData.target_slug || `qr-${Date.now()}`
      });

      setIsCreateDialogOpen(false);
      setNewQRData({ display_label: '', target_slug: '' });
      
      toast({
        title: 'QR Code créé',
        description: 'Le QR Code a été créé avec succès'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le QR Code',
        variant: 'destructive'
      });
    }
  };

  const handleRegenerate = async (qrId: string) => {
    try {
      await regenerateQRCode(qrId);
      toast({
        title: 'QR Code régénéré',
        description: 'Le QR Code a été régénéré avec succès'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de régénérer le QR Code',
        variant: 'destructive'
      });
    }
  };

  const handleDeactivate = async (qrId: string) => {
    try {
      await deactivateQRCode(qrId);
      toast({
        title: 'QR Code désactivé',
        description: 'Le QR Code a été désactivé avec succès'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver le QR Code',
        variant: 'destructive'
      });
    }
  };

  const generateQRCodeURL = (qr: QRCode) => {
    return `${getBaseUrl()}/qr/${qr.target_slug}`;
  };

  const downloadQRCode = (qr: QRCode) => {
    // Generate QR code SVG and download it
    const url = generateQRCodeURL(qr);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Simple placeholder - in real app, use a QR code library like qrcode.js
    if (ctx) {
      canvas.width = 200;
      canvas.height = 200;
      ctx.fillStyle = '#000';
      ctx.fillRect(50, 50, 100, 100);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(qr.target_slug || '', 10, 180);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `qr-${qr.display_label || qr.id}.png`;
          link.click();
        }
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Codes QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Codes QR {locationName && `- ${locationName}`}
          </CardTitle>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Créer QR Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau QR Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_label">Libellé d'affichage</Label>
                  <Input
                    id="display_label"
                    value={newQRData.display_label}
                    onChange={(e) => setNewQRData(prev => ({ ...prev, display_label: e.target.value }))}
                    placeholder={locationName || "Nom du QR Code"}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target_slug">Identifiant unique</Label>
                  <Input
                    id="target_slug"
                    value={newQRData.target_slug}
                    onChange={(e) => setNewQRData(prev => ({ ...prev, target_slug: e.target.value }))}
                    placeholder="qr-unique-id"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateQR}>
                    Créer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {qrCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun QR Code créé pour cet emplacement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active QR Code */}
            {activeQR && (
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-green-900">QR Code Actif</h3>
                    <p className="text-sm text-green-700">{activeQR.display_label}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <Eye className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <Hash className="h-3 w-3" />
                    <span>Version {activeQR.version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(activeQR.last_regenerated_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{activeQR.target_slug}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRegenerate(activeQR.id)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Régénérer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadQRCode(activeQR)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Télécharger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeactivate(activeQR.id)}
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Désactiver
                  </Button>
                </div>
                
                <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800 font-mono break-all">
                  {generateQRCodeURL(activeQR)}
                </div>
              </div>
            )}
            
            {/* Inactive QR Codes */}
            {qrCodes.filter(qr => !qr.is_active).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-muted-foreground">Historique des QR Codes</h4>
                <div className="space-y-2">
                  {qrCodes
                    .filter(qr => !qr.is_active)
                    .map((qr) => (
                      <div key={qr.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{qr.display_label}</span>
                            <Badge variant="outline" className="text-xs">
                              <EyeOff className="h-2 w-2 mr-1" />
                              Inactif
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>Version {qr.version}</span>
                            <span>
                              {formatDistanceToNow(new Date(qr.last_regenerated_at), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}