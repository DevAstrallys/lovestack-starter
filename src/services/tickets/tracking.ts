/**
 * Tracking code utilities for anonymous ticket follow-up.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:tickets:tracking');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1

/**
 * Generate a tracking code in XXXX-XXXX format.
 */
export function generateTrackingCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Search a ticket by its tracking code stored in meta->>'tracking_code'.
 */
export async function searchTicketByTrackingCode(trackingCode: string) {
  try {
    const normalized = trackingCode.trim().toUpperCase();
    const { data, error } = await supabase
      .from('tickets')
      .select('id, title, status, created_at, updated_at, meta, description')
      .eq('meta->>tracking_code', normalized)
      .single();
    if (error) throw error;
    log.info('Ticket found by tracking code', { trackingCode: normalized });
    return data;
  } catch (err) {
    log.warn('Ticket not found by tracking code', { trackingCode, error: err });
    return null;
  }
}

/**
 * Fetch public (non-internal) activities for a ticket.
 */
export async function fetchPublicActivities(ticketId: string) {
  try {
    const { data, error } = await supabase
      .from('ticket_activities')
      .select('id, activity_type, content, created_at, metadata')
      .eq('ticket_id', ticketId)
      .eq('is_internal', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch public activities', { ticketId, error: err });
    return [];
  }
}
