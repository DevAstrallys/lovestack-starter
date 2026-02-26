import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';

const ROLES = [
  { value: 'locataire', label: 'Locataire' },
  { value: 'proprietaire', label: 'Propriétaire' },
  { value: 'prestataire', label: 'Prestataire' },
  { value: 'visiteur', label: 'Visiteur' },
  { value: 'gardien', label: 'Gardien' },
  { value: 'autre', label: 'Autre' },
];

export interface ProfileData {
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  email: string;
}

interface Props {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
}

export function ReportStepProfile({ data, onChange }: Props) {
  const set = (key: keyof ProfileData, value: string) => onChange({ ...data, [key]: value });

  return (
    <TicketFormStep title="Étape 1 — Qui êtes-vous ?">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="last_name">Nom *</Label>
          <Input id="last_name" value={data.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Dupont" className="min-h-[44px]" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom *</Label>
          <Input id="first_name" value={data.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jean" className="min-h-[44px]" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rôle *</Label>
        <Select value={data.role} onValueChange={v => set('role', v)}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Sélectionner votre rôle" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile</Label>
          <Input id="phone" type="tel" value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="06 12 34 56 78" className="min-h-[44px]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="jean@exemple.com" className="min-h-[44px]" />
        </div>
      </div>
    </TicketFormStep>
  );
}
