/**
 * Locations service — QR codes CRUD and location hierarchy queries.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:locations');

// ─── QR Code types ───────────────────────────────────────────────

export interface QRCodeCreatePayload {
  display_label: string;
  target_slug: string;
  organization_id: string;
  created_by?: string;
  location_element_id?: string | null;
  location_group_id?: string | null;
  location_ensemble_id?: string | null;
  form_config?: Record<string, unknown>;
  location?: Record<string, unknown>;
}

// ─── QR Code operations ──────────────────────────────────────────

/**
 * Deactivates all active QR codes for a specific location target.
 * Returns the count of deactivated rows.
 */
export async function deactivateQRCodesForLocation(params: {
  location_element_id?: string;
  location_group_id?: string;
  location_ensemble_id?: string;
}): Promise<number> {
  try {
    let query = supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('is_active', true);

    if (params.location_element_id) {
      query = query.eq('location_element_id', params.location_element_id);
    } else if (params.location_group_id) {
      query = query.eq('location_group_id', params.location_group_id);
    } else if (params.location_ensemble_id) {
      query = query.eq('location_ensemble_id', params.location_ensemble_id);
    } else {
      log.warn('deactivateQRCodesForLocation called without any location target');
      return 0;
    }

    const { data, error } = await query.select('id');
    if (error) throw error;

    const count = data?.length ?? 0;
    log.info('Deactivated QR codes', { ...params, count });
    return count;
  } catch (err) {
    log.error('Failed to deactivate QR codes', { ...params, error: err });
    throw err;
  }
}

/**
 * Creates a new QR code. Ensures previous active QR codes
 * for the same location are deactivated first.
 */
export async function createQRCode(payload: QRCodeCreatePayload) {
  try {
    // 1. Deactivate existing active QR codes for same location
    await deactivateQRCodesForLocation({
      location_element_id: payload.location_element_id ?? undefined,
      location_group_id: payload.location_group_id ?? undefined,
      location_ensemble_id: payload.location_ensemble_id ?? undefined,
    });

    // 2. Insert the new QR code
    const insertData: Record<string, unknown> = {
      display_label: payload.display_label,
      target_slug: payload.target_slug,
      organization_id: payload.organization_id,
      created_by: payload.created_by ?? null,
      location_element_id: payload.location_element_id ?? null,
      location_group_id: payload.location_group_id ?? null,
      location_ensemble_id: payload.location_ensemble_id ?? null,
      form_config: payload.form_config ?? {},
      location: payload.location ?? null,
      version: 1,
      is_active: true,
      last_regenerated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('qr_codes')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;

    log.info('QR code created', { id: data.id, slug: payload.target_slug });
    return data;
  } catch (err) {
    log.error('Failed to create QR code', { payload, error: err });
    throw err;
  }
}

/**
 * Updates a QR code's metadata (form_config, display_label, etc.).
 */
export async function updateQRCode(qrId: string, updates: Record<string, unknown>) {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .update(updates)
      .eq('id', qrId)
      .select()
      .single();

    if (error) throw error;
    log.info('QR code updated', { id: qrId });
    return data;
  } catch (err) {
    log.error('Failed to update QR code', { qrId, error: err });
    throw err;
  }
}

/**
 * Fetches all QR codes for an organization, with location relation names.
 */
export async function fetchQRCodesForOrganization(organizationId: string) {
  try {
    // Get location IDs for this org
    const [elementsRes, groupsRes, ensemblesRes] = await Promise.all([
      supabase.from('location_elements').select('id, name').eq('organization_id', organizationId),
      supabase.from('location_groups').select('id, name').eq('organization_id', organizationId),
      supabase.from('location_ensembles').select('id, name').eq('organization_id', organizationId),
    ]);

    if (elementsRes.error) throw elementsRes.error;
    if (groupsRes.error) throw groupsRes.error;
    if (ensemblesRes.error) throw ensemblesRes.error;

    const elements = elementsRes.data ?? [];
    const groups = groupsRes.data ?? [];
    const ensembles = ensemblesRes.data ?? [];

    const elementIds = elements.map(e => e.id);
    const groupIds = groups.map(g => g.id);
    const ensembleIds = ensembles.map(e => e.id);

    // Build OR filter — at least one list must be non-empty
    const filters: string[] = [];
    if (elementIds.length) filters.push(`location_element_id.in.(${elementIds.join(',')})`);
    if (groupIds.length) filters.push(`location_group_id.in.(${groupIds.join(',')})`);
    if (ensembleIds.length) filters.push(`location_ensemble_id.in.(${ensembleIds.join(',')})`);
    // Also include QR codes with organization_id directly
    filters.push(`organization_id.eq.${organizationId}`);

    const { data: qrData, error } = await supabase
      .from('qr_codes')
      .select('*')
      .or(filters.join(','))
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with location names
    const enriched = (qrData ?? []).map(qr => {
      let location_type: 'element' | 'group' | 'ensemble' | null = null;
      let location_name: string | null = null;

      if (qr.location_element_id) {
        const el = elements.find(e => e.id === qr.location_element_id);
        if (el) { location_type = 'element'; location_name = el.name; }
      } else if (qr.location_group_id) {
        const gr = groups.find(g => g.id === qr.location_group_id);
        if (gr) { location_type = 'group'; location_name = gr.name; }
      } else if (qr.location_ensemble_id) {
        const en = ensembles.find(e => e.id === qr.location_ensemble_id);
        if (en) { location_type = 'ensemble'; location_name = en.name; }
      }

      return { ...qr, location_type, location_name };
    });

    log.info('QR codes fetched for org', { organizationId, count: enriched.length });
    return { qrCodes: enriched, elements, groups, ensembles };
  } catch (err) {
    log.error('Failed to fetch QR codes for org', { organizationId, error: err });
    throw err;
  }
}

/**
 * Fetches location elements, groups, and ensembles for an organization.
 */
export async function fetchOrganizationLocations(organizationId: string) {
  try {
    const [elementsRes, groupsRes, ensemblesRes] = await Promise.all([
      supabase.from('location_elements').select('*').eq('organization_id', organizationId).order('name'),
      supabase.from('location_groups').select('*').eq('organization_id', organizationId).order('name'),
      supabase.from('location_ensembles').select('*').eq('organization_id', organizationId).order('name'),
    ]);

    if (elementsRes.error) throw elementsRes.error;
    if (groupsRes.error) throw groupsRes.error;
    if (ensemblesRes.error) throw ensemblesRes.error;

    return {
      elements: elementsRes.data ?? [],
      groups: groupsRes.data ?? [],
      ensembles: ensemblesRes.data ?? [],
    };
  } catch (err) {
    log.error('Failed to fetch organization locations', { organizationId, error: err });
    throw err;
  }
}

// ─── Location hierarchy resolution ──────────────────────────────

/**
 * Fetch element IDs belonging to a given group.
 */
export async function fetchElementIdsByGroupId(groupId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('location_elements')
      .select('id')
      .eq('parent_id', groupId);
    if (error) throw error;
    return (data ?? []).map(e => e.id);
  } catch (err) {
    log.error('Failed to fetch element IDs by group', { groupId, error: err });
    throw err;
  }
}

/**
 * Fetch element IDs belonging to a given ensemble (ensemble → groups → elements).
 */
export async function fetchElementIdsByEnsembleId(ensembleId: string): Promise<string[]> {
  try {
    const { data: groups, error: gErr } = await supabase
      .from('location_groups')
      .select('id')
      .eq('parent_id', ensembleId);
    if (gErr) throw gErr;

    const groupIds = (groups ?? []).map(g => g.id);
    if (groupIds.length === 0) return [];

    const { data: elements, error: eErr } = await supabase
      .from('location_elements')
      .select('id')
      .in('parent_id', groupIds);
    if (eErr) throw eErr;

    return (elements ?? []).map(e => e.id);
  } catch (err) {
    log.error('Failed to fetch element IDs by ensemble', { ensembleId, error: err });
    throw err;
  }
}
