/**
 * /src/types/enums.ts
 *
 * Shared enum types derived from Supabase schema.
 * These mirror Database['public']['Enums'] but are importable without
 * pulling the entire generated types file.
 */

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting'
  | 'resolved'
  | 'closed'
  | 'canceled';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type Initiality = 'initial' | 'relance';

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected';
