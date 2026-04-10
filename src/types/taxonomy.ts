/**
 * /src/types/taxonomy.ts
 *
 * Taxonomy types — the universal classification service.
 * Used by: Tickets, Main Courante, Documents, Contrats, Entreprises, Réception de Travaux.
 *
 * Replaces inline definitions in:
 *   hooks/useTaxonomy.ts, pages/TicketForm.tsx, components/locations/QRCodeFormConfig.tsx,
 *   services/tickets/taxonomy.ts
 */

// ── Core taxonomy tree ───────────────────────────────────────────────

export interface TaxAction {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  color: string | null;
  description: string | null;
}

export interface TaxCategory {
  id: string;
  key: string;
  label: string;
  action_id: string;
  label_i18n?: Record<string, string> | null;
}

export interface TaxObject {
  id: string;
  key: string;
  label: string;
  category_id: string;
  urgency_level: number | null;
  is_private: boolean | null;
  label_i18n?: Record<string, string> | null;
}

export interface TaxDetail {
  id: string;
  key: string;
  label: string;
  object_id: string;
  urgency_level: number;
  is_private: boolean;
  label_i18n?: Record<string, string> | null;
}

// ── Auto-learning suggestions ────────────────────────────────────────

/**
 * Context passed when recording a "Autre" free-text suggestion.
 * Allows the system to scope suggestions per module, per taxonomy level,
 * and per organization — so a suggestion from Tickets doesn't pollute
 * the Main Courante taxonomy.
 */
export interface TaxSuggestionContext {
  /** Which module recorded this suggestion */
  module: 'tickets' | 'main_courante' | 'documents' | 'contrats' | 'entreprises' | 'reception_travaux';
  /** Which taxonomy level: action, category, object, or detail */
  level: 'action' | 'category' | 'object' | 'detail';
  /** Parent ID at the level above (e.g., category_id when level='object') */
  parent_id?: string | null;
  /** Organization scope */
  organization_id?: string | null;
  /** Optional: QR code that triggered this suggestion */
  qr_code_id?: string | null;
}

export interface TaxSuggestion {
  id: string;
  type: string;
  free_text: string;
  occurrences: number;
  status: string;
  action_id: string | null;
  category_id: string | null;
  organization_id: string | null;
  qr_code_id: string | null;
  created_at: string;
}

// ── Location overrides (org-specific taxonomy adjustments) ───────────

export interface LocationOverride {
  id: string;
  organization_id: string;
  category_id?: string | null;
  object_id?: string | null;
  is_hidden: boolean;
  custom_label?: string | null;
}
