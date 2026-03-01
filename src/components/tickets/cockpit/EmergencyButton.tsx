import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Flame, Droplets, ShieldAlert, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket } from '@/hooks/useTickets';

interface EmergencyButtonProps {
  ticket: Ticket;
}

const EMERGENCY_TYPES = [
  { key: 'fire', label: 'Incendie', icon: Flame, number: '18', color: 'bg-red-600' },
  { key: 'gas', label: 'Fuite de gaz', icon: AlertTriangle, number: '0 800 47 33 33', color: 'bg-orange-600' },
  { key: 'flood', label: 'Inondation', icon: Droplets, number: '18', color: 'bg-blue-600' },
  { key: 'police', label: 'Police', icon: ShieldAlert, number: '17', color: 'bg-indigo-600' },
];

export function EmergencyButton({ ticket }: EmergencyButtonProps) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [buildingInfo, setBuildingInfo] = useState<any>(null);

  useEffect(() => {
    async function check() {
      if (!ticket.building_id) return;
      const { data } = await supabase
        .from('buildings')
        .select('name, address, city, emergency_module_enabled, emergency_contacts')
        .eq('id', ticket.building_id)
        .single();
      if (data?.emergency_module_enabled) {
        setEnabled(true);
        setBuildingInfo(data);
      }
    }
    check();
  }, [ticket.building_id]);

  if (!enabled) return null;

  const location = ticket.location as Record<string, any> | null;
  const locationName = location?.name || location?.element_name || buildingInfo?.name || 'Site inconnu';
  const address = buildingInfo?.address ? `${buildingInfo.address}, ${buildingInfo.city || ''}` : 'Adresse non renseignée';

  const generateScript = (type: string) => {
    return `Alerte Astralink sur le site ${locationName}. Adresse : ${address}. Nature : ${type}.`;
  };

  return (
    <>
      <Button
        variant="destructive"
        className="w-full animate-pulse hover:animate-none gap-2 font-bold"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="h-4 w-4" />
        ALERTE SECOURS
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alerte d'urgence — {locationName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {EMERGENCY_TYPES.map((etype) => (
              <div
                key={etype.key}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full text-white ${etype.color}`}>
                    <etype.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{etype.label}</p>
                    <p className="text-xs text-muted-foreground">{etype.number}</p>
                  </div>
                </div>
                <a href={`tel:${etype.number.replace(/\s/g, '')}`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Phone className="h-3 w-3" /> Appeler
                  </Button>
                </a>
              </div>
            ))}

            <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Script vocal prêt
              </p>
              <p className="text-sm text-foreground italic">
                "{generateScript(EMERGENCY_TYPES[0].label)}"
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
