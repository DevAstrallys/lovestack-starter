/**
 * Tickets service — CRUD and status management for tickets.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

const log = createLogger('service:tickets');

export type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
type TicketUpdate = Database['public']['Tables']['tickets']['Update'];
type ActivityInsert = Database['public']['Tables']['ticket_activities']['Insert'];

type TicketStatus = Database['public']['Enums']['ticket_status'];
type TicketPriority = Database['public']['Enums']['ticket_priority'];

export interface TicketQueryFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
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

/**
 * Fetch tickets with dynamic filters and pagination.
 * Returns { data, count }.
 */
export async function fetchFilteredTickets(
  filters: TicketQueryFilters,
  page = 0,
  limit = 20
) {
  try {
    let query = supabase
      .from('tickets')
      .select('*', { count: 'exact' })
      .order('last_interaction_at', { ascending: false });

    if (filters.status?.length) query = query.in('status', filters.status);
    if (filters.priority?.length) query = query.in('priority', filters.priority);
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters.objectId) query = query.eq('object_id', filters.objectId);
    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
    if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
    if (filters.organizationId) query = query.eq('organization_id', filters.organizationId);

    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    if (filters.lastInteractionDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.lastInteractionDays);
      query = query.gte('last_interaction_at', cutoff.toISOString());
    }

    if (filters.search) {
      const sanitized = filters.search
        .replace(/[\\%_]/g, c => `\\${c}`)
        .replace(/[,()]/g, '')
        .trim()
        .slice(0, 200);
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    if (filters.locationElementId) {
      query = query.contains('location', { element_id: filters.locationElementId });
    }

    if (filters.ticketIdWhitelist) {
      if (filters.ticketIdWhitelist.length === 0) {
        return { data: [], count: 0 };
      }
      query = query.in('id', filters.ticketIdWhitelist);
    }

    query = query.range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    log.info('Filtered tickets fetched', { count: data?.length, page });
    return { data: data ?? [], count: count ?? 0 };
  } catch (err) {
    log.error('Failed to fetch filtered tickets', { error: err });
    throw err;
  }
}

/**
 * Fetch ticket IDs whose location JSON contains one of the given element IDs.
 */
export async function fetchTicketIdsByElementIds(elementIds: string[]): Promise<string[]> {
  try {
    if (elementIds.length === 0) return [];
    const results = await Promise.all(
      elementIds.map(elementId =>
        supabase
          .from('tickets')
          .select('id')
          .contains('location', { element_id: elementId })
      )
    );
    const ids = results
      .filter(r => !r.error)
      .flatMap(r => r.data?.map(t => t.id) ?? []);
    return [...new Set(ids)];
  } catch (err) {
    log.error('Failed to fetch ticket IDs by element IDs', { error: err });
    throw err;
  }
}

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

export async function fetchOrganizationEnsembles(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('location_ensembles')
      .select('id, name, description, organization_id')
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
    log.info('fetchQrCodeBySlug called', { slug });

    const { data, error } = await supabase
      .from('qr_codes_public')
      .select('*')
      .eq('target_slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    log.info('fetchQrCodeBySlug result', { slug, data, error });

    if (error) throw error;
    if (!data) {
      log.warn('fetchQrCodeBySlug: no active QR found', { slug });
      return null;
    }

    // Enrich with location names
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
