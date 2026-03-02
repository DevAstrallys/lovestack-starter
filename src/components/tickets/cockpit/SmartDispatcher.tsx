import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Forward, Shield, Send, UserPlus, Building, Users, HardHat } from 'lucide-react';
import { Ticket, TicketActivity } from '@/hooks/useTickets';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SmartDispatcherProps {
  ticket: Ticket;
  activities: TicketActivity[];
  onDispatched?: () => void;
  selectedMessageIds?: Set<string>;
}

type TargetType = 'prestataire' | 'conseil_syndical' | 'concierge';

const TARGET_TABS: { key: TargetType; label: string; icon: React.ElementType }[] = [
  { key: 'prestataire', label: 'Prestataire', icon: HardHat },
  { key: 'conseil_syndical', label: 'Conseil Syndical', icon: Users },
  { key: 'concierge', label: 'Concierge', icon: Building },
];

export function SmartDispatcher({ ticket, activities, onDispatched, selectedMessageIds }: SmartDispatcherProps) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<TargetType>('prestataire');
  const [manualEmail, setManualEmail] = useState('');
  const [instructions, setInstructions] = useState('');
  const [includeRGPD, setIncludeRGPD] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const selectedCount = selectedMessageIds?.size || 0;

  const handleDispatch = async () => {
    if (!manualEmail.trim() && !targetType) return;
    setSending(true);
    try {
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        actor_id: user?.id || null,
        activity_type: 'assignment',
        content: instructions || null,
        metadata: {
          dispatch_target: targetType,
          dispatch_email: manualEmail.trim() || null,
          include_rgpd: includeRGPD,
          selected_messages: selectedMessageIds ? Array.from(selectedMessageIds) : [],
          dispatched_at: new Date().toISOString(),
        },
      });

      // Update assigned_at if not already set
      const ticketAny = ticket as any;
      if (!ticketAny.assigned_at) {
        await supabase.from('tickets').update({ assigned_at: new Date().toISOString() } as any).eq('id', ticket.id);
      }

      const targetLabel = TARGET_TABS.find(t => t.key === targetType)?.label || targetType;
      toast.success(`Transféré vers : ${targetLabel}${manualEmail ? ` (${manualEmail})` : ''}`);
      setOpen(false);
      resetForm();
      onDispatched?.();
    } catch {
      toast.error('Erreur lors du transfert');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setManualEmail('');
    setInstructions('');
    setIncludeRGPD(false);
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <Forward className="h-4 w-4" /> Transférer / Actionner
        {selectedCount > 0 && (
          <Badge variant="secondary" className="ml-1 text-[10px]">{selectedCount} msg</Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="h-5 w-5" /> Dispatcher intelligent
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Target type tabs */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type de destinataire</Label>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setTargetType(tab.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                      targetType === tab.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-accent/50 border-border'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Destinataire</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="E-mail du destinataire…"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  type="email"
                  className="flex-1"
                />
                <Button variant="outline" size="icon" className="shrink-0" title="Ajouter un contact">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Saisissez l'email ou ajoutez un contact depuis le répertoire de l'immeuble.
              </p>
            </div>

            {/* Selected messages info */}
            {selectedCount > 0 ? (
              <div className="p-3 rounded-lg border bg-accent/30">
                <p className="text-xs font-medium text-foreground">
                  ✅ {selectedCount} message(s) sélectionné(s) pour inclusion
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Seuls les messages cochés dans la discussion seront transmis au destinataire.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50/50">
                <p className="text-xs font-medium text-yellow-800">
                  ⚠️ Aucun message sélectionné
                </p>
                <p className="text-[10px] text-yellow-700 mt-0.5">
                  Cochez les messages dans la discussion pour les inclure dans le transfert.
                </p>
              </div>
            )}

            {/* RGPD toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Inclure les coordonnées</p>
                  <p className="text-xs text-muted-foreground">RGPD — Nom, email, téléphone du déclarant</p>
                </div>
              </div>
              <Switch checked={includeRGPD} onCheckedChange={setIncludeRGPD} />
            </div>

            {/* Instructions */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Instructions complémentaires</Label>
              <Textarea
                placeholder="Message d'accompagnement pour le destinataire…"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleDispatch} disabled={sending} className="gap-2">
              <Send className="h-4 w-4" /> Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
