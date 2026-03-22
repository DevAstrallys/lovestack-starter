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

export async function fetchOrganizationEnsembles(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('location_ensembles')
      .select('id, name, description')
      .eq('organization_id', organizationId)
      .order('name');
    if (error) throw error;
    log.info('Ensembles fetched', { count: data?.length, organizationId });
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch organization ensembles', { organizationId, error: err });
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

/**
 * Fetch an active QR code by its target slug, enriched with location names.
 * Uses the qr_codes_public view (no RLS) so anonymous/guest users can access it.
 */
export async function fetchQrCodeBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('qr_codes_public')
      .select('*')
      .eq('target_slug', slug)
      .eq('is_active', true)
      .single();
    if (error) throw error;

    // qr_codes_public doesn't include location names, so enrich them.
    // These tables have permissive SELECT for authenticated OR can be read
    // via the anon key since location data is non-sensitive.
    let _elName: string | null = null;
    let _grName: string | null = null;
    let _enName: string | null = null;

    if (data.location_element_id) {
      const { data: el } = await supabase.from('location_elements').select('name').eq('id', data.location_element_id).maybeSingle();
      _elName = el?.name || null;
    }
    if (data.location_group_id) {
      const { data: gr } = await supabase.from('location_groups').select('name').eq('id', data.location_group_id).maybeSingle();
      _grName = gr?.name || null;
    }
    if (data.location_ensemble_id) {
      const { data: en } = await supabase.from('location_ensembles').select('name').eq('id', data.location_ensemble_id).maybeSingle();
      _enName = en?.name || null;
    }

    log.info('QR code fetched from public view', { slug, qrId: data.id });
    return { ...data, _elName, _grName, _enName };
  } catch (err) {
    log.error('Failed to fetch QR code by slug', { slug, error: err });
    throw err;
  }
}

/**
 * Check if an organization is premium.
 */
export async function fetchOrganizationPremiumStatus(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('is_premium')
      .eq('id', organizationId)
      .single();
    if (error) throw error;
    return data?.is_premium ?? false;
  } catch (err) {
    log.error('Failed to fetch org premium status', { organizationId, error: err });
    return false;
  }
}
