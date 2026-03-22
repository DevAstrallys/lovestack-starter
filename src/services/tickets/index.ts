/**
 * Tickets service — CRUD and status management for tickets.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

const log = createLogger('service:tickets');

type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
type TicketUpdate = Database['public']['Tables']['tickets']['Update'];
type ActivityInsert = Database['public']['Tables']['ticket_activities']['Insert'];

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

export async function updateTicket(ticketId: string, updates: TicketUpdate) {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
      .select();
    if (error) throw error;
    log.info('Ticket updated', { ticketId });
    return data;
  } catch (err) {
    log.error('Failed to update ticket', { ticketId, error: err });
    throw err;
  }
}

export async function createTicket(ticketData: TicketInsert) {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();
    if (error) throw error;
    log.info('Ticket created', { ticketId: data.id });
    return data;
  } catch (err) {
    log.error('Failed to create ticket', { error: err });
    throw err;
  }
}

export async function fetchTicketById(ticketId: string) {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    log.error('Failed to fetch ticket', { ticketId, error: err });
    throw err;
  }
}

export async function fetchTicketActivities(ticketId: string) {
  try {
    const { data, error } = await supabase
      .from('ticket_activities')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    log.error('Failed to fetch ticket activities', { ticketId, error: err });
    throw err;
  }
}

export async function addTicketActivity(activity: ActivityInsert) {
  try {
    const { data, error } = await supabase
      .from('ticket_activities')
      .insert(activity)
      .select()
      .single();
    if (error) throw error;
    log.info('Activity added', { ticketId: activity.ticket_id, type: activity.activity_type });
    return data;
  } catch (err) {
    log.error('Failed to add activity', { error: err });
    throw err;
  }
}

export async function fetchBuildings(ids: string[]) {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('id, name, organization_id')
      .in('id', ids);
    if (error) throw error;
    return data;
  } catch (err) {
    log.error('Failed to fetch buildings', { error: err });
    throw err;
  }
}

export async function fetchOrganizations(ids: string[]) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', ids);
    if (error) throw error;
    return data;
  } catch (err) {
    log.error('Failed to fetch organizations', { error: err });
    throw err;
  }
}

export async function uploadTicketAttachment(ticketId: string, file: File) {
  try {
    const path = `${ticketId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('ticket-attachments').upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('ticket-attachments').getPublicUrl(path);
    log.info('Attachment uploaded', { ticketId, fileName: file.name });
    return { publicUrl: urlData.publicUrl, fileName: file.name };
  } catch (err) {
    log.error('Failed to upload attachment', { ticketId, error: err });
    throw err;
  }
}
