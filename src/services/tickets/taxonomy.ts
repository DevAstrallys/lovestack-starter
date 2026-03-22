/**
 * Taxonomy service — queries for tax_actions/categories/objects/details,
 * tax_suggestions upsert, duplicate detection, and location fetching.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:tickets:taxonomy');

/* ─── Taxonomy queries ─── */

export async function fetchTaxActions() {
  try {
    const { data, error } = await supabase
      .from('tax_actions')
      .select('id, key, label, icon, color, description')
      .order('label');
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch tax_actions', { error: err });
    return [];
  }
}

export async function fetchTaxCategories(actionId: string) {
  try {
    const { data, error } = await supabase
      .from('tax_categories')
      .select('id, key, label, action_id')
      .eq('action_id', actionId)
      .order('label');
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch tax_categories', { error: err });
    return [];
  }
}

export async function fetchTaxObjects(categoryId: string) {
  try {
    const { data, error } = await supabase
      .from('tax_objects')
      .select('id, key, label, category_id, urgency_level, is_private')
      .eq('category_id', categoryId)
      .order('label');
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch tax_objects', { error: err });
    return [];
  }
}

/* ─── Tax suggestions (crowd-sourced terms) ─── */

export async function upsertTaxSuggestion(params: {
  type: 'category' | 'object' | 'location';
  freeText: string;
  actionId?: string;
  categoryId?: string;
  organizationId?: string;
  qrCodeId?: string;
}) {
  try {
    const normalized = params.freeText.trim();
    if (!normalized) return;

    // Check if suggestion already exists
    let query = supabase
      .from('tax_suggestions')
      .select('id, occurrences')
      .eq('type', params.type)
      .eq('free_text', normalized);

    if (params.actionId) query = query.eq('action_id', params.actionId);
    if (params.categoryId) query = query.eq('category_id', params.categoryId);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      // Increment occurrences via direct update (trigger handles auto-approve at 50)
      const { error } = await supabase
        .from('tax_suggestions')
        .update({ occurrences: existing.occurrences + 1 })
        .eq('id', existing.id);
      if (error) throw error;
      log.info('Tax suggestion occurrence incremented', { id: existing.id, type: params.type });
    } else {
      // Insert new suggestion
      const { error } = await supabase
        .from('tax_suggestions')
        .insert({
          type: params.type,
          free_text: normalized,
          action_id: params.actionId || null,
          category_id: params.categoryId || null,
          organization_id: params.organizationId || null,
          qr_code_id: params.qrCodeId || null,
        });
      if (error) throw error;
      log.info('Tax suggestion created', { type: params.type, freeText: normalized });
    }
  } catch (err) {
    log.error('Failed to upsert tax suggestion', { error: err, params });
  }
}

/* ─── Duplicate detection ─── */

export interface DuplicateCandidate {
  id: string;
  title: string;
  status: string;
  created_at: string;
  follower_count: number;
}

export async function searchDuplicateTickets(params: {
  organizationId: string;
  categoryId: string;
}): Promise<DuplicateCandidate[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('tickets')
      .select('id, title, status, created_at')
      .eq('organization_id', params.organizationId)
      .eq('category_id', params.categoryId)
      .not('status', 'in', '("resolved","closed")')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Fetch follower counts
    const ticketIds = data.map(t => t.id);
    const { data: followers } = await supabase
      .from('ticket_followers')
      .select('ticket_id')
      .in('ticket_id', ticketIds);

    const followerMap: Record<string, number> = {};
    (followers ?? []).forEach(f => {
      followerMap[f.ticket_id] = (followerMap[f.ticket_id] || 0) + 1;
    });

    return data.map(t => ({
      ...t,
      follower_count: followerMap[t.id] || 0,
    }));
  } catch (err) {
    log.error('Failed to search duplicate tickets', { error: err });
    return [];
  }
}

/* ─── Follow a ticket (join as follower) ─── */

export async function followTicket(ticketId: string, email: string, name?: string) {
  try {
    const { error } = await supabase
      .from('ticket_followers')
      .insert({
        ticket_id: ticketId,
        follower_email: email,
        follower_name: name || null,
      });
    if (error) throw error;
    log.info('Ticket followed', { ticketId, email });
    return true;
  } catch (err) {
    log.error('Failed to follow ticket', { ticketId, error: err });
    return false;
  }
}

/* ─── Organization locations ─── */

export async function fetchOrganizationLocations(organizationId: string) {
  try {
    const [elementsRes, groupsRes] = await Promise.all([
      supabase
        .from('location_elements')
        .select('id, name, parent_id')
        .eq('organization_id', organizationId)
        .order('name'),
      supabase
        .from('location_groups')
        .select('id, name, parent_id')
        .eq('organization_id', organizationId)
        .order('name'),
    ]);

    return {
      elements: elementsRes.data ?? [],
      groups: groupsRes.data ?? [],
    };
  } catch (err) {
    log.error('Failed to fetch organization locations', { organizationId, error: err });
    return { elements: [], groups: [] };
  }
}
