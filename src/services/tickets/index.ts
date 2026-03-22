/**
 * Tickets service — CRUD and status management for tickets.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:tickets');

export async function fetchTickets(organizationId?: string) {
  try {
    let query = supabase.from('tickets').select('*');
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    const { data, error } = await query;
    if (error) throw error;
    log.info('Tickets fetched', { count: data?.length, organizationId });
    return data;
  } catch (err) {
    log.error('Failed to fetch tickets', { organizationId, error: err });
    throw err;
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'canceled'
) {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) throw error;
    log.info('Ticket status updated', { ticketId, status });
    return data;
  } catch (err) {
    log.error('Failed to update ticket status', { ticketId, status, error: err });
    throw err;
  }
}
