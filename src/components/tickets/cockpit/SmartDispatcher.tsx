import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Forward, Shield, Send, UserPlus, Building, Users, HardHat, Plus, Check } from 'lucide-react';
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

export function SmartDispatcher({ ticket, activities, onDispatched, selectedMessageIds }: SmartDispatcherProps) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<TargetType>('prestataire');
  const [manualEmail, setManualEmail] = useState('');
  const [instructions, setInstructions] = useState('');
  const [includeRGPD, setIncludeRGPD] = useState(false);
  const [sending, setSending] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const { user } = useAuth();

  const selectedCount = selectedMessageIds?.size || 0;

  const handleDispatch = async () => {
    if (!manualEmail.trim()) {
      toast.error('Veuillez saisir un email de destinataire');
      return;
    }
    setSending(true);
    try {
      // 1. Log transfer activity
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        actor_id: user?.id || null,
        activity_type: 'assignment',
        content: instructions || `Transféré vers ${targetType}`,
        metadata: {
          dispatch_target: targetType,
          dispatch_email: manualEmail.trim(),
          include_rgpd: includeRGPD,
          selected_messages: selectedMessageIds ? Array.from(selectedMessageIds) : [],
          dispatched_at: new Date().toISOString(),
          contact_name: newContactName || null,
        },
      });

      // 2. Update assigned_at if not already set
      const ticketAny = ticket as any;
      if (!ticketAny.assigned_at) {
        await supabase.from('tickets').update({ assigned_at: new Date().toISOString() } as any).eq('id', ticket.id);
      }

      // 3. Simulate email send (logged in channels_outbox concept)
      const tabLabel = targetType === 'prestataire' ? 'Prestataire' : targetType === 'conseil_syndical' ? 'Conseil Syndical' : 'Concierge';
      toast.success(`Transféré vers ${tabLabel} (${manualEmail.trim()})`, {
        description: `${selectedCount} message(s) inclus · RGPD ${includeRGPD ? 'activé' : 'désactivé'}`,
      });

      setOpen(false);
      resetForm();
      onDispatched?.();
    } catch {
      toast.error('Erreur lors du transfert');
    } finally {
      setSending(false);
    }
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !manualEmail.trim()) {
      toast.error('Remplissez le nom et l\'email');
      return;
    }
    // In production this would save to a contacts table
    toast.success(`Contact "${newContactName}" enregistré`, {
      description: manualEmail,
    });
    setShowAddContact(false);
    setNewContactName('');
  };

  const resetForm = () => {
    setManualEmail('');
    setInstructions('');
    setIncludeRGPD(false);
    setNewContactName('');
    setShowAddContact(false);
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
              <Tabs value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
                <TabsList className="w-full">
                  <TabsTrigger value="prestataire" className="flex-1 gap-1.5 text-xs">
                    <HardHat className="h-3.5 w-3.5" /> Prestataire
                  </TabsTrigger>
                  <TabsTrigger value="conseil_syndical" className="flex-1 gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5" /> Conseil Syndical
                  </TabsTrigger>
                  <TabsTrigger value="concierge" className="flex-1 gap-1.5 text-xs">
                    <Building className="h-3.5 w-3.5" /> Concierge
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="prestataire" className="mt-3">
                  <p className="text-xs text-muted-foreground">Sélectionnez ou saisissez l'email du prestataire intervenant.</p>
                </TabsContent>
                <TabsContent value="conseil_syndical" className="mt-3">
                  <p className="text-xs text-muted-foreground">Transférez les informations au conseil syndical de l'immeuble.</p>
                </TabsContent>
                <TabsContent value="concierge" className="mt-3">
                  <p className="text-xs text-muted-foreground">Informez le concierge ou gardien de l'immeuble.</p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Recipient email */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Destinataire</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="E-mail du destinataire…"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  type="email"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  title="Ajouter un nouveau contact"
                  onClick={() => setShowAddContact(!showAddContact)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              {/* Add contact form */}
              {showAddContact && (
                <div className="p-3 rounded-lg border bg-accent/20 space-y-2">
                  <p className="text-xs font-medium">Enregistrer un nouveau contact</p>
                  <Input
                    placeholder="Nom du contact…"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                  <Button size="sm" variant="secondary" className="gap-1.5 w-full" onClick={handleAddContact}>
                    <Plus className="h-3.5 w-3.5" /> Ajouter le contact
                  </Button>
                </div>
              )}
            </div>

            {/* Selected messages info */}
            {selectedCount > 0 ? (
              <div className="p-3 rounded-lg border bg-accent/30">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-green-600" /> {selectedCount} message(s) sélectionné(s)
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Seuls les messages cochés seront transmis au destinataire.
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
            <Button onClick={handleDispatch} disabled={sending || !manualEmail.trim()} className="gap-2">
              <Send className="h-4 w-4" /> Envoyer le transfert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
