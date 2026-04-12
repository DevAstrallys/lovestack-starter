import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Flame, Droplets, ShieldAlert, Phone, Volume2 } from 'lucide-react';
import type { Ticket } from '@/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('component:emergency-button');

interface EmergencyContact { name?: string; label?: string; role?: string; phone?: string; email?: string; }

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
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const isUrgentPriority = ticket.priority === 'urgent' || ticket.priority === 'high';

  // Show emergency button only for urgent/high priority tickets
  if (!isUrgentPriority) return null;

  const location = ticket.location as Record<string, unknown> | null;
  const locationName = (location?.name as string) || (location?.element_name as string) || (location?.ensemble_name as string) || (location?.group_name as string) || 'Site inconnu';
  const address = location?.address
    ? `${location.address as string}, ${(location.city as string) || ''}`
    : 'Adresse non renseignée';

  // Extract access codes from location data if available
  const accessCodes = location?.access_codes || location?.vigik || location?.digicode || null;
  // Extract emergency contacts from location data if available
  const emergencyContacts = (location?.emergency_contacts as EmergencyContact[] | undefined) || [];

  const generateScript = (type: string) => {
    let script = `Alerte Astralink sur le site ${locationName}. Adresse : ${address}. Nature : ${type}.`;
    if (accessCodes) {
      script += ` Codes d'accès : ${typeof accessCodes === 'string' ? accessCodes : JSON.stringify(accessCodes)}.`;
    }
    return script;
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      log.warn('Speech synthesis not available in this browser');
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        className="w-full animate-pulse hover:animate-none gap-2 font-bold text-sm"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="h-4 w-4" />
        🚨 ALERTE SECOURS
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
            {EMERGENCY_TYPES.map((etype) => {
              const script = generateScript(etype.label);
              const isSelected = selectedType === etype.key;

              return (
                <div key={etype.key} className="space-y-2">
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected ? 'bg-accent border-primary' : 'bg-card hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedType(isSelected ? null : etype.key)}
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
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={(e) => { e.stopPropagation(); handleSpeak(script); }}
                        title="Lire le script vocal"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                      <a href={`tel:${etype.number.replace(/\s/g, '')}`} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Phone className="h-3 w-3" /> Appeler
                        </Button>
                      </a>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="ml-12 p-3 rounded-lg bg-muted/50 border border-dashed">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Volume2 className="h-3 w-3" /> Script vocal
                      </p>
                      <p className="text-sm text-foreground italic">"{script}"</p>
                    </div>
                  )}
                </div>
              );
            })}

            {emergencyContacts.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Contacts d'urgence du site
                </p>
                {emergencyContacts.map((contact: EmergencyContact, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                    <span>{contact.name || contact.label || `Contact ${i + 1}`}</span>
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`}>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs">
                          <Phone className="h-3 w-3" /> {contact.phone}
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
