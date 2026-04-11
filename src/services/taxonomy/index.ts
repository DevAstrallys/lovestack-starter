/**
 * /src/services/taxonomy/index.ts
 *
 * Taxonomy service — universal classification for all modules.
 * Migrated from services/tickets/taxonomy.ts to be a Core service.
 *
 * Absorbs direct supabase calls from:
 *   hooks/useTaxonomy.ts (tax_actions, tax_categories, tax_objects, tax_details,
 *                         location_category_overrides, location_object_overrides,
 *                         location_custom_objects)
 *   pages/TicketForm.tsx (via services/tickets/taxonomy.ts)
 *
 * The old services/tickets/taxonomy.ts should re-export from here for
 * backward compatibility during migration.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import type {
  TaxAction,
  TaxCategory,
  TaxObject,
  TaxDetail,
  TaxSuggestion,
  TaxSuggestionContext,
  LocationOverride,
} from '@/types';

const log = createLogger('service:taxonomy');

// ── Core taxonomy queries ────────────────────────────────────────────

export async function fetchTaxActions(): Promise<TaxAction[]> {
  try {
    const { data, error } = await supabase
      .from('tax_actions')
      .select('id, key, label, icon, color, description')
      .order('label');
    if (error) throw error;
    return (data ?? []) as TaxAction[];
  } catch (err) {
    log.error('Failed to fetch tax_actions', { error: err });
    return [];
  }
}

export async function fetchTaxCategories(actionId: string): Promise<TaxCategory[]> {
  try {
    const { data, error } = await supabase
      .from('tax_categories')
      .select('id, key, label, action_id, label_i18n')
      .eq('action_id', actionId)
      .order('label');
    if (error) throw error;
    return (data ?? []) as TaxCategory[];
  } catch (err) {
    log.error('Failed to fetch tax_categories', { error: err });
    return [];
  }
}

export async function fetchTaxObjects(categoryId: string): Promise<TaxObject[]> {
  try {
    const { data, error } = await supabase
      .from('tax_objects')
      .select('id, key, label, category_id, urgency_level, is_private, label_i18n')
      .eq('category_id', categoryId)
      .order('label');
    if (error) throw error;
    return (data ?? []) as TaxObject[];
  } catch (err) {
    log.error('Failed to fetch tax_objects', { error: err });
    return [];
  }
}

export async function fetchTaxDetails(objectId: string): Promise<TaxDetail[]> {
  try {
    const { data, error } = await supabase
      .from('tax_details')
      .select('id, key, label, object_id, urgency_level, is_private, label_i18n')
      .eq('object_id', objectId)
      .order('label');
    if (error) throw error;
    return (data ?? []) as TaxDetail[];
  } catch (err) {
    log.error('Failed to fetch tax_details', { error: err });
    return [];
  }
}

/**
 * Fetch all taxonomy levels at once.
 * Used by hooks/useTaxonomy.ts for preloading.
 */
export async function fetchAllTaxonomy(): Promise<{
  actions: TaxAction[];
  categories: TaxCategory[];
  objects: TaxObject[];
  details: TaxDetail[];
}> {
  try {
    const [actionsRes, categoriesRes, objectsRes, detailsRes] = await Promise.all([
      supabase.from('tax_actions').select('*').order('label'),
      supabase.from('tax_categories').select('*').order('label'),
      supabase.from('tax_objects').select('*').order('label'),
      supabase.from('tax_details').select('*').order('label'),
    ]);

    return {
      actions: (actionsRes.data ?? []) as TaxAction[],
      categories: (categoriesRes.data ?? []) as TaxCategory[],
      objects: (objectsRes.data ?? []) as TaxObject[],
      details: (detailsRes.data ?? []) as TaxDetail[],
    };
  } catch (err) {
    log.error('Failed to fetch all taxonomy', { error: err });
    return { actions: [], categories: [], objects: [], details: [] };
  }
}

// ── Location overrides ───────────────────────────────────────────────

export interface LocationOverrides {
  categoryOverrides: Array<{ category_id: string; enabled: boolean }>;
  objectOverrides: Array<{ object_id: string; enabled: boolean }>;
  customObjects: Array<{ category_id: string; custom_label: string }>;
}

export async function fetchLocationOverrides(
  locationId: string,
): Promise<LocationOverrides> {
  try {
    const [catRes, objRes, customRes] = await Promise.all([
      supabase
        .from('location_category_overrides')
        .select('category_id, enabled')
        .eq('location_id', locationId),
      supabase
        .from('location_object_overrides')
        .select('object_id, enabled')
        .eq('location_id', locationId),
      supabase
        .from('location_custom_objects')
        .select('category_id, custom_label')
        .eq('location_id', locationId)
        .eq('enabled', true),
    ]);

    return {
      categoryOverrides: catRes.data ?? [],
      objectOverrides: objRes.data ?? [],
      customObjects: customRes.data ?? [],
    };
  } catch (err) {
    log.error('Failed to fetch location overrides', { locationId, error: err });
    return { categoryOverrides: [], objectOverrides: [], customObjects: [] };
  }
}

// ── Auto-learning suggestions ────────────────────────────────────────

/**
 * Record a "Autre" free-text suggestion with full context.
 * The context includes which module, which taxonomy level, and which org
 * so that suggestions stay scoped and don't pollute across modules.
 */
export async function upsertTaxSuggestion(params: {
  free_text: string;
  type: string;
  context: TaxSuggestionContext;
  action_id?: string | null;
  category_id?: string | null;
}): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('tax_suggestions')
      .select('id, occurrences')
      .eq('free_text', params.free_text.trim())
      .eq('type', params.type)
      .eq('organization_id', params.context.organization_id ?? '')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('tax_suggestions')
        .update({ occurrences: existing.occurrences + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('tax_suggestions').insert({
        free_text: params.free_text.trim(),
        type: params.type,
        status: 'pending',
        action_id: params.action_id ?? null,
        category_id: params.category_id ?? null,
        organization_id: params.context.organization_id ?? null,
        qr_code_id: params.context.qr_code_id ?? null,
      });
    }

    log.info('Tax suggestion upserted', {
      text: params.free_text,
      module: params.context.module,
      level: params.context.level,
    });
  } catch (err) {
    log.error('Failed to upsert tax suggestion', { error: err });
  }
}

// ── Duplicate detection (ticket-specific but taxonomy-driven) ────────

export interface DuplicateCandidate {
  id: string;
  title: string;
  status: string;
  created_at: string;
  location: Record<string, unknown> | null;
}

export async function searchDuplicateTickets(params: {
  organizationId: string;
  categoryId?: string;
  objectId?: string;
  elementId?: string;
  excludeTicketId?: string;
  limit?: number;
}): Promise<DuplicateCandidate[]> {
  try {
    let query = supabase
      .from('tickets')
      .select('id, title, status, created_at, location')
      .eq('organization_id', params.organizationId)
      .in('status', ['open', 'in_progress', 'waiting'])
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 5);

    if (params.categoryId) query = query.eq('category_id', params.categoryId);
    if (params.objectId) query = query.eq('object_id', params.objectId);
    if (params.excludeTicketId) query = query.neq('id', params.excludeTicketId);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as DuplicateCandidate[];
  } catch (err) {
    log.error('Failed to search duplicate tickets', { error: err });
    return [];
  }
}
