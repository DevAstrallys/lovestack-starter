/**
 * /src/components/tickets/shared/constants.ts
 *
 * Shared constants for ticket forms (public + internal).
 * Single source of truth — no more duplication.
 */

export const TOTAL_STEPS = 3;

export const URGENCY_LEVELS = [
  { value: 4, label: 'Personnes', sla: '< 1h', dot: '🔴', cls: 'border-red-500 bg-red-500/10 text-red-700' },
  { value: 3, label: 'Immeuble', sla: '< 24h', dot: '🟠', cls: 'border-orange-500 bg-orange-500/10 text-orange-700' },
  { value: 2, label: 'Moyen', sla: '< 72h', dot: '🟡', cls: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' },
  { value: 1, label: 'Faible', sla: '< 7 jours', dot: '🟢', cls: 'border-green-500 bg-green-500/10 text-green-700' },
] as const;

export const PROFILE_ROLES = [
  { value: 'locataire', label: 'Locataire' },
  { value: 'proprietaire', label: 'Propriétaire occupant' },
  { value: 'proprietaire_bailleur', label: 'Propriétaire bailleur' },
  { value: 'gardien', label: 'Gardien / Concierge' },
  { value: 'conseil_syndical', label: 'Membre du conseil syndical' },
  { value: 'prestataire', label: 'Prestataire / Technicien' },
  { value: 'visiteur', label: 'Visiteur' },
  { value: 'autre', label: 'Autre' },
] as const;

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  storagePath: string;
}
