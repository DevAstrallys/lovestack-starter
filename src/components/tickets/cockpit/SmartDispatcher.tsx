import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Forward, Shield, FileText, Send } from 'lucide-react';
import { Ticket, TicketActivity } from '@/hooks/useTickets';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SmartDispatcherProps {
  ticket: Ticket;
  activities: TicketActivity[];
  onDispatched?: () => void;
}

const TARGETS = [
  { value: 'prestataire', label: 'Prestataire' },
  { value: 'conseil_syndical', label: 'Conseil syndical' },
  { value: 'concierge', label: 'Concierge' },
];

export function SmartDispatcher({ ticket, activities, onDispatched }: SmartDispatcherProps) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [instructions, setInstructions] = useState('');
  const [includeRGPD, setIncludeRGPD] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const replyActivities = activities
    .filter(a => a.activity_type === 'reply')
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

  const toggleMessage = (id: string) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDispatch = async () => {
    if (!target) return;
    setSending(true);
    try {
      // Log the transfer as an activity
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        actor_id: user?.id || null,
        activity_type: 'assignment',
        content: instructions || null,
        metadata: {
          dispatch_target: target,
          include_rgpd: includeRGPD,
          selected_messages: Array.from(selectedMessages),
          dispatched_at: new Date().toISOString(),
        },
      });

      toast.success(`Transféré vers : ${TARGETS.find(t => t.value === target)?.label}`);
      setOpen(false);
      setTarget('');
      setInstructions('');
      setSelectedMessages(new Set());
      setIncludeRGPD(false);
      onDispatched?.();
    } catch {
      toast.error('Erreur lors du transfert');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <Forward className="h-4 w-4" /> Transférer / Actionner
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="h-5 w-5" /> Dispatcher intelligent
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Target selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Destinataire</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une cible…" />
                </SelectTrigger>
                <SelectContent>
                  {TARGETS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message selection */}
            {replyActivities.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> Messages à inclure
                </Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto rounded border p-2">
                  {/* Original description */}
                  <label className="flex items-start gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-accent/50">
                    <Checkbox
                      checked={selectedMessages.has('original')}
                      onCheckedChange={() => toggleMessage('original')}
                      className="mt-0.5"
                    />
                    <span className="line-clamp-2 text-muted-foreground">
                      [Description] {ticket.description?.slice(0, 100)}
                    </span>
                  </label>
                  {replyActivities.map(a => (
                    <label key={a.id} className="flex items-start gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-accent/50">
                      <Checkbox
                        checked={selectedMessages.has(a.id)}
                        onCheckedChange={() => toggleMessage(a.id)}
                        className="mt-0.5"
                      />
                      <span className="line-clamp-2 text-muted-foreground">
                        {a.content?.slice(0, 100)}
                      </span>
                    </label>
                  ))}
                </div>
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
            <Button onClick={handleDispatch} disabled={!target || sending} className="gap-2">
              <Send className="h-4 w-4" /> Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
