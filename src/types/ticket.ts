/**
 * /src/types/ticket.ts
 *
 * All ticket-related types.
 * Source of truth — replaces inline definitions in:
 *   hooks/useTickets.ts, pages/TicketForm.tsx, components/tickets/TicketCreateForm.tsx,
 *   services/tickets/index.ts, services/tickets/taxonomy.ts
 */

export type { TicketStatus, TicketPriority } from './enums';

// ── Ticket sub-structures ────────────────────────────────────────────

/** JSON structure stored in tickets.location */
export interface TicketLocation {
  ensemble_id?: string | null;
  group_id?: string | null;
  element_id?: string | null;
  ensemble_name?: string | null;
  group_name?: string | null;
  element_name?: string | null;
}

/** JSON structure stored in tickets.meta */
export interface TicketMeta {
  tracking_code?: string | null;
  reporter_role?: string | null;
  signature_data_url?: string | null;
  form_config_id?: string | null;
  [key: string]: unknown;
}

/** Single attachment entry stored in tickets.attachments JSON array */
export interface TicketAttachment {
  name: string;
  url: string;
  type: string;
  storagePath: string;
}

// ── Main Ticket entity ───────────────────────────────────────────────

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: import('./enums').TicketStatus;
  priority: import('./enums').TicketPriority | null;
  organization_id: string | null;
  building_id: string | null;
  created_by: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
  category_id: string | null;
  category_code: string | null;
  object_id: string | null;
  action_code: string | null;
  nature_code: string | null;
  source: string | null;
  communication_mode: string | null;
  language: string | null;
  location: TicketLocation | null;
  attachments: TicketAttachment[] | null;
  meta: TicketMeta | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  initiality: string | null;
  relance_index: number | null;
  duplicate_of_id: string | null;
  follow_up_of_id: string | null;
  sla_due_at: string | null;
  first_opened_at: string | null;
  first_responded_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
  /** Enriched at runtime — not stored in DB */
  building_name?: string;
  /** Enriched at runtime — not stored in DB */
  organization_name?: string;
}

// ── Ticket Activity ──────────────────────────────────────────────────

export interface TicketActivityMeta {
  from?: string | null;
  to?: string | null;
  file_url?: string | null;
  [key: string]: unknown;
}

export interface TicketActivity {
  id: string;
  ticket_id: string;
  activity_type: string;
  actor_id: string | null;
  content: string | null;
  old_value: string | null;
  new_value: string | null;
  is_internal: boolean | null;
  metadata: TicketActivityMeta | null;
  created_at: string | null;
}

// ── Query filters ────────────────────────────────────────────────────

export interface TicketFilters {
  status?: import('./enums').TicketStatus[];
  priority?: import('./enums').TicketPriority[];
  categoryId?: string;
  objectId?: string;
  assignedTo?: string;
  createdBy?: string;
  organizationId?: string;
  dateRange?: { start: string; end: string };
  lastInteractionDays?: number;
  search?: string;
  ticketIdWhitelist?: string[];
  locationElementId?: string;
}

// ── Duplicate detection ──────────────────────────────────────────────

export interface DuplicateCandidate {
  id: string;
  title: string;
  status: string;
  created_at: string;
  location: TicketLocation | null;
}
