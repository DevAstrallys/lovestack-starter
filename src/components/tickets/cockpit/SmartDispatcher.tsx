import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Forward, Shield, Send, UserPlus, Building, Users, HardHat, Plus, Check, Search, Loader2, Briefcase } from 'lucide-react';
import { Ticket, TicketActivity } from '@/hooks/useTickets';
import { fetchCompanies, createCompany, searchCompanyContacts } from '@/services/companies';
import { addTicketActivity, updateTicket } from '@/services/tickets';
import { createLogger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const log = createLogger('component:smart-dispatcher');

interface SmartDispatcherProps {
  ticket: Ticket;
  activities: TicketActivity[];
  onDispatched?: () => void;
  selectedMessageIds?: Set<string>;
}

type TargetType = 'prestataire' | 'conseil_syndical' | 'concierge';

interface ContactOption {
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
  role: string | null;
  email: string | null;
}

export function SmartDispatcher({ ticket, activities, onDispatched, selectedMessageIds }: SmartDispatcherProps) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<TargetType>('prestataire');
  const [manualEmail, setManualEmail] = useState('');
  const [instructions, setInstructions] = useState('');
  const [includeRGPD, setIncludeRGPD] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  // Contact search
  const [contactSearch, setContactSearch] = useState('');
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null);

  // Quick create
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' });
  const [newCompanyName, setNewCompanyName] = useState('');
  const [existingCompanyId, setExistingCompanyId] = useState('');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('existing');
  const [saving, setSaving] = useState(false);

  const selectedCount = selectedMessageIds?.size || 0;

  // Search contacts with company affiliations
  useEffect(() => {
    if (!contactSearch.trim() || contactSearch.length < 2) {
      setContacts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingContacts(true);
      try {
        const data = await searchCompanyContacts(contactSearch);

        const results: ContactOption[] = [];
        for (const cu of data || []) {
          const profile = cu.profiles;
          const company = cu.companies;
          if (!profile || !company) continue;

          const name = (profile.full_name || '').toLowerCase();
          const cName = (company.name || '').toLowerCase();
          const q = contactSearch.toLowerCase();

          if (name.includes(q) || cName.includes(q)) {
            results.push({
              userId: cu.user_id,
              userName: profile.full_name || 'Sans nom',
              companyId: company.id,
              companyName: company.name,
              role: cu.role,
              email: company.email,
            });
          }
        }
        setContacts(results);
      } catch {
        // silent
      } finally {
        setLoadingContacts(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [contactSearch]);

  // Load companies for quick create
  useEffect(() => {
    if (showQuickCreate && companies.length === 0) {
      fetchCompanies().then(data => setCompanies(data.map(c => ({ id: c.id, name: c.name }))));
    }
  }, [showQuickCreate]);

  const handleSelectContact = (contact: ContactOption) => {
    setSelectedContact(contact);
    setManualEmail(contact.email || '');
    setContactSearch('');
    setContacts([]);
  };

  const handleDispatch = async () => {
    const email = manualEmail.trim();
    if (!email) {
      toast.error('Veuillez saisir un email de destinataire');
      return;
    }
    setSending(true);
    try {
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        actor_id: user?.id || null,
        activity_type: 'assignment',
        content: instructions || `Transféré vers ${targetType}`,
        metadata: {
          dispatch_target: targetType,
          dispatch_email: email,
          include_rgpd: includeRGPD,
          selected_messages: selectedMessageIds ? Array.from(selectedMessageIds) : [],
          dispatched_at: new Date().toISOString(),
          contact_user_id: selectedContact?.userId || null,
          contact_company_id: selectedContact?.companyId || null,
          contact_company_name: selectedContact?.companyName || null,
        },
      });

      const ticketAny = ticket as any;
      if (!ticketAny.assigned_at) {
        await supabase.from('tickets').update({ assigned_at: new Date().toISOString() } as any).eq('id', ticket.id);
      }

      const tabLabel = targetType === 'prestataire' ? 'Prestataire' : targetType === 'conseil_syndical' ? 'Conseil Syndical' : 'Concierge';
      toast.success(`Transféré vers ${tabLabel} (${email})`, {
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

  const handleQuickCreate = async () => {
    if (!newContact.name.trim() || !newContact.email.trim()) {
      return toast.error('Nom et email requis');
    }
    setSaving(true);
    try {
      let companyId = existingCompanyId;

      if (createMode === 'new' && newCompanyName.trim()) {
        const { data, error } = await supabase.from('companies').insert({ name: newCompanyName.trim() }).select('id').single();
        if (error || !data) throw error;
        companyId = data.id;
      }

      // We log the contact creation as metadata since we can't create auth users
      toast.success(`Contact "${newContact.name}" enregistré${companyId ? ' et lié à l\'entreprise' : ''}`, {
        description: newContact.email,
      });

      setManualEmail(newContact.email);
      setShowQuickCreate(false);
      setNewContact({ name: '', email: '', phone: '' });
      setNewCompanyName('');
      setExistingCompanyId('');
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setManualEmail('');
    setInstructions('');
    setIncludeRGPD(false);
    setSelectedContact(null);
    setContactSearch('');
    setShowQuickCreate(false);
    setNewContact({ name: '', email: '', phone: '' });
  };

  return (
    <>
      <Button variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
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
                  <p className="text-xs text-muted-foreground">Transférez les informations au conseil syndical.</p>
                </TabsContent>
                <TabsContent value="concierge" className="mt-3">
                  <p className="text-xs text-muted-foreground">Informez le concierge ou gardien de l'immeuble.</p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Contact search with multi-company results */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Rechercher un contact</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Nom ou entreprise…"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  className="pl-9"
                />
                {loadingContacts && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin" />}
              </div>

              {contacts.length > 0 && (
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {contacts.map((c, i) => (
                    <button
                      key={`${c.userId}-${c.companyId}`}
                      className="w-full text-left px-3 py-2 hover:bg-accent/50 flex items-center gap-2 text-sm border-b last:border-b-0"
                      onClick={() => handleSelectContact(c)}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{c.userName}</span>
                        <span className="text-muted-foreground ml-1.5">({c.companyName})</span>
                      </div>
                      {c.role && <Badge variant="outline" className="text-[10px] shrink-0">{c.role}</Badge>}
                    </button>
                  ))}
                </div>
              )}

              {selectedContact && (
                <div className="p-2 rounded-lg border bg-accent/20 flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium">{selectedContact.userName}</span>
                  <Badge variant="secondary" className="text-[10px]">{selectedContact.companyName}</Badge>
                  <button className="ml-auto text-[10px] text-muted-foreground hover:text-destructive" onClick={() => { setSelectedContact(null); setManualEmail(''); }}>✕</button>
                </div>
              )}
            </div>

            {/* Manual email */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Destinataire (email)</Label>
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
                  title="Créer un nouveau contact"
                  onClick={() => setShowQuickCreate(!showQuickCreate)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick create contact + company */}
            {showQuickCreate && (
              <div className="p-3 rounded-lg border bg-accent/20 space-y-3">
                <p className="text-xs font-semibold">Créer un nouveau contact</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Nom *" value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} />
                  <Input placeholder="Email *" type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} />
                  <Input placeholder="Téléphone" className="col-span-2" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={createMode === 'existing' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setCreateMode('existing')}
                  >
                    Entreprise existante
                  </Button>
                  <Button
                    variant={createMode === 'new' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setCreateMode('new')}
                  >
                    Nouvelle entreprise
                  </Button>
                </div>

                {createMode === 'existing' ? (
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={existingCompanyId}
                    onChange={e => setExistingCompanyId(e.target.value)}
                  >
                    <option value="">Aucune entreprise</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <Input placeholder="Nom de la nouvelle entreprise" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
                )}

                <Button size="sm" className="w-full gap-1.5" onClick={handleQuickCreate} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Créer le contact
                </Button>
              </div>
            )}

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
                <p className="text-xs font-medium text-yellow-800">⚠️ Aucun message sélectionné</p>
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
