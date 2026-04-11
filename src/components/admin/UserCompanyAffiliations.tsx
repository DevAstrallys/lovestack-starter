import React, { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { fetchCompanies as fetchCompaniesService, fetchCompanyUsersByUserId, affiliateUserToCompany, removeCompanyUser, createCompanyAndAffiliate } from '@/services/companies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, Trash2, Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const log = createLogger('component:company-affiliations');

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tags: string[] | null;
}

interface CompanyUser {
  id: string;
  company_id: string;
  role: string | null;
  company: Company;
}

interface Props {
  userId: string;
  userName: string | null;
}

export function UserCompanyAffiliations({ userId, userName }: Props) {
  const [affiliations, setAffiliations] = useState<CompanyUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);

  // New company form
  const [newCompany, setNewCompany] = useState({ name: '', email: '', phone: '', address: '', city: '', tags: '' });

  const fetchAffiliations = async () => {
    try {
      const data = await fetchCompanyUsersByUserId(userId);
      setAffiliations(
        (data || []).map((d: any) => ({
          id: d.id,
          company_id: d.company_id,
          role: d.role,
          company: d.companies,
        }))
      );
    } catch (err) {
      log.error('Failed to fetch affiliations', { userId, error: err });
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await fetchCompaniesService();
      setCompanies(data as Company[]);
    } catch (err) {
      log.error('Failed to fetch companies', { error: err });
    }
  };

  useEffect(() => {
    Promise.all([fetchAffiliations(), loadCompanies()]).finally(() => setLoading(false));
  }, [userId]);

  const handleAdd = async () => {
    if (!selectedCompanyId) return toast.error('Sélectionnez une entreprise');
    setSaving(true);
    try {
      await affiliateUserToCompany({ user_id: userId, company_id: selectedCompanyId, role: role || undefined });
    } catch (err) {
      setSaving(false);
      return toast.error('Erreur lors de l\'ajout');
    }
    setSaving(false);
    toast.success('Affiliation ajoutée');
    setShowAdd(false);
    setSelectedCompanyId('');
    setRole('');
    fetchAffiliations();
  };

  const handleCreateCompanyAndLink = async () => {
    if (!newCompany.name.trim()) return toast.error('Nom requis');
    setSaving(true);
    try {
      await createCompanyAndAffiliate(newCompany.name.trim(), userId, role || undefined);
    } catch (err) {
      setSaving(false);
      return toast.error('Erreur création entreprise');
    }

    setSaving(false);
    toast.success(`Entreprise "${newCompany.name}" créée et liée`);
    setShowNewCompany(false);
    setShowAdd(false);
    setNewCompany({ name: '', email: '', phone: '', address: '', city: '', tags: '' });
    setRole('');
    fetchAffiliations();
    loadCompanies();
  };

  const handleRemove = async (id: string) => {
    try {
      await removeCompanyUser(id);
    } catch (err) {
      return toast.error('Erreur');
    }
    toast.success('Affiliation supprimée');
    fetchAffiliations();
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Affiliations Professionnelles
        </h4>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
        </Button>
      </div>

      {affiliations.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aucune affiliation professionnelle</p>
      ) : (
        <div className="space-y-2">
          {affiliations.map((aff) => (
            <div key={aff.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{aff.company.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {aff.role && <Badge variant="secondary" className="text-[10px]">{aff.role}</Badge>}
                    {aff.company.city && <span className="text-[10px] text-muted-foreground">{aff.company.city}</span>}
                    {aff.company.tags?.map(t => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(aff.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add affiliation dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une affiliation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!showNewCompany ? (
              <>
                <div>
                  <Label className="text-xs">Entreprise existante</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                    <SelectContent>
                      {companies
                        .filter(c => !affiliations.some(a => a.company_id === c.id))
                        .map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Rôle dans l'entreprise</Label>
                  <Input placeholder="Gérant, Technicien, Comptable…" value={role} onChange={e => setRole(e.target.value)} />
                </div>
                <div className="flex justify-between">
                  <Button variant="link" size="sm" onClick={() => setShowNewCompany(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Créer une entreprise
                  </Button>
                  <Button onClick={handleAdd} disabled={saving || !selectedCompanyId}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Ajouter
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Nom de l'entreprise *</Label>
                    <Input value={newCompany.name} onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={newCompany.email} onChange={e => setNewCompany(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Téléphone</Label>
                    <Input value={newCompany.phone} onChange={e => setNewCompany(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Adresse</Label>
                    <Input value={newCompany.address} onChange={e => setNewCompany(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Ville</Label>
                    <Input value={newCompany.city} onChange={e => setNewCompany(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Tags d'activité (séparés par virgule)</Label>
                    <Input placeholder="Plomberie, Chauffage…" value={newCompany.tags} onChange={e => setNewCompany(p => ({ ...p, tags: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Rôle de l'utilisateur</Label>
                    <Input placeholder="Gérant, Technicien…" value={role} onChange={e => setRole(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setShowNewCompany(false)}>Retour</Button>
                  <Button onClick={handleCreateCompanyAndLink} disabled={saving || !newCompany.name.trim()}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Créer et lier
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
