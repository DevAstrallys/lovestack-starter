/**
 * Locations service — QR codes CRUD and location hierarchy queries.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

type EnsembleRow = Database['public']['Tables']['location_ensembles']['Row'];
type EnsembleInsert = Database['public']['Tables']['location_ensembles']['Insert'];
type EnsembleUpdate = Database['public']['Tables']['location_ensembles']['Update'];
type GroupRow = Database['public']['Tables']['location_groups']['Row'];
type GroupInsert = Database['public']['Tables']['location_groups']['Insert'];
type GroupUpdate = Database['public']['Tables']['location_groups']['Update'];
type ElementRow = Database['public']['Tables']['location_elements']['Row'];
type ElementUpdate = Database['public']['Tables']['location_elements']['Update'];
type EnsembleTagInsert = Database['public']['Tables']['location_ensemble_tags']['Insert'];
type GroupTagInsert = Database['public']['Tables']['location_group_tags']['Insert'];
type TagInsert = Database['public']['Tables']['location_tags']['Insert'];
type QRCodeInsert = Database['public']['Tables']['qr_codes']['Insert'];

interface GroupTagJoin { group_id: string; location_tags: { id: string; name: string; color: string } }
interface EnsembleTagJoin { ensemble_id: string; location_tags: { id: string; name: string; color: string } }

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
    const insertData: QRCodeInsert = {
      display_label: payload.display_label,
      target_slug: payload.target_slug,
      organization_id: payload.organization_id,
      created_by: payload.created_by ?? null,
      location_element_id: payload.location_element_id ?? null,
      location_group_id: payload.location_group_id ?? null,
      location_ensemble_id: payload.location_ensemble_id ?? null,
      form_config: (payload.form_config ?? {}) as Database['public']['Tables']['qr_codes']['Insert']['form_config'],
      location: (payload.location ?? null) as Database['public']['Tables']['qr_codes']['Insert']['location'],
      version: 1,
      is_active: true,
      last_regenerated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('qr_codes')
      .insert(insertData)
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

/**
 * Fetches all location elements accessible to the current user (RLS-filtered).
 * Used for flat location dropdowns (e.g. ticket filters).
 */
export async function fetchAccessibleLocationElements(): Promise<
  { id: string; name: string; description: string | null }[]
> {
  try {
    const { data, error } = await supabase
      .from('location_elements')
      .select('id, name, description')
      .order('name');

    if (error) throw error;

    log.info('Fetched accessible location elements', { count: data?.length ?? 0 });
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch accessible location elements', { error: err });
    throw err;
  }
}

// ─── QR Code queries by location ────────────────────────────────

/**
 * Fetches QR codes for a given location element, with related location names.
 * If no locationElementId is provided, returns all QR codes.
 */
export async function fetchQRCodesByLocation(locationElementId?: string) {
  try {
    let query = supabase
      .from('qr_codes')
      .select(`
        *,
        location_elements(name),
        location_groups(name),
        location_ensembles(name)
      `)
      .order('version', { ascending: false });

    if (locationElementId) {
      query = query.eq('location_element_id', locationElementId);
    }

    const { data, error } = await query;
    if (error) throw error;

    log.info('QR codes fetched', { count: data?.length ?? 0, locationElementId });
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch QR codes by location', { locationElementId, error: err });
    throw err;
  }
}

/**
 * Deactivates all active QR codes for a specific location element.
 */
export async function deactivateActiveQRCodesForLocation(locationElementId: string) {
  try {
    const { error } = await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('location_element_id', locationElementId)
      .eq('is_active', true);

    if (error) throw error;
    log.info('Active QR codes deactivated', { locationElementId });
  } catch (err) {
    log.error('Failed to deactivate QR codes', { locationElementId, error: err });
    throw err;
  }
}

/**
 * Calls the regenerate_qr_code RPC to bump version and update timestamp.
 */
export async function regenerateQRCode(qrId: string) {
  try {
    const { data, error } = await supabase.rpc('regenerate_qr_code', { qr_id: qrId });
    if (error) throw error;

    log.info('QR code regenerated via RPC', { qrId, resultId: data });
    return data;
  } catch (err) {
    log.error('Failed to regenerate QR code', { qrId, error: err });
    throw err;
  }
}

// ─── Ensemble operations ────────────────────────────────────────

/**
 * Fetches ensembles for an organization with their child groups and tags.
 */
export async function fetchEnsemblesWithRelations(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('location_ensembles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;

    const ensembleIds = (data || []).map((e: EnsembleRow) => e.id);
    if (ensembleIds.length === 0) return [];

    const [groupsRes, tagsRes] = await Promise.all([
      supabase.from('location_groups').select('*').in('parent_id', ensembleIds),
      supabase.from('location_ensemble_tags').select('*, location_tags(*)').in('ensemble_id', ensembleIds)
    ]);

    if (groupsRes.error) throw groupsRes.error;
    if (tagsRes.error) throw tagsRes.error;

    const groupsByEnsemble = (groupsRes.data || []).reduce((acc: Record<string, GroupRow[]>, g: GroupRow & { parent_id: string }) => {
      (acc[g.parent_id] = acc[g.parent_id] || []).push(g);
      return acc;
    }, {});

    const tagsByEnsemble = (tagsRes.data || []).reduce((acc: Record<string, { id: string; name: string; color: string }[]>, et: EnsembleTagJoin) => {
      (acc[et.ensemble_id] = acc[et.ensemble_id] || []).push(et.location_tags);
      return acc;
    }, {} as Record<string, { id: string; name: string; color: string }[]>);

    const result = (data || []).map((ensemble: EnsembleRow) => ({
      ...ensemble,
      groups: groupsByEnsemble[ensemble.id] || [],
      tags: tagsByEnsemble[ensemble.id] || []
    }));

    log.info('Ensembles with relations fetched', { organizationId, count: result.length });
    return result;
  } catch (err) {
    log.error('Failed to fetch ensembles with relations', { organizationId, error: err });
    throw err;
  }
}

/**
 * Saves (create or update) an ensemble with its group assignments and tags.
 */
export async function saveEnsemble(params: {
  id?: string;
  name: string;
  description: string | null;
  organization_id: string;
  selectedGroups: string[];
  selectedTags: string[];
}) {
  try {
    let ensembleId: string;

    if (params.id) {
      const ensembleData: EnsembleUpdate = {
        name: params.name,
        description: params.description,
        organization_id: params.organization_id,
      };
      const { error } = await supabase
        .from('location_ensembles')
        .update(ensembleData)
        .eq('id', params.id);
      if (error) throw error;
      ensembleId = params.id;
    } else {
      const ensembleData: EnsembleInsert = {
        name: params.name,
        description: params.description,
        organization_id: params.organization_id,
      };
      const { data, error } = await supabase
        .from('location_ensembles')
        .insert(ensembleData)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('No data returned from ensemble insert');
      ensembleId = data.id;
    }

    // Update group assignments
    const detachUpdate: GroupUpdate = { parent_id: null };
    await supabase
      .from('location_groups')
      .update(detachUpdate)
      .eq('parent_id', ensembleId);

    if (params.selectedGroups.length > 0) {
      const attachUpdate: GroupUpdate = { parent_id: ensembleId };
      const { error: groupError } = await supabase
        .from('location_groups')
        .update(attachUpdate)
        .in('id', params.selectedGroups);
      if (groupError) throw groupError;
    }

    // Update tags
    await supabase
      .from('location_ensemble_tags')
      .delete()
      .eq('ensemble_id', ensembleId);

    if (params.selectedTags.length > 0) {
      const tagInserts: EnsembleTagInsert[] = params.selectedTags.map(tagId => ({
        ensemble_id: ensembleId,
        tag_id: tagId,
      }));
      const { error: tagError } = await supabase
        .from('location_ensemble_tags')
        .insert(tagInserts);
      if (tagError) throw tagError;
    }

    log.info('Ensemble saved', { ensembleId, isUpdate: !!params.id });
    return ensembleId;
  } catch (err) {
    log.error('Failed to save ensemble', { error: err });
    throw err;
  }
}

/**
 * Deletes an ensemble by ID.
 */
export async function deleteEnsemble(ensembleId: string) {
  try {
    const { error } = await supabase
      .from('location_ensembles')
      .delete()
      .eq('id', ensembleId);
    if (error) throw error;
    log.info('Ensemble deleted', { ensembleId });
  } catch (err) {
    log.error('Failed to delete ensemble', { ensembleId, error: err });
    throw err;
  }
}

// ─── Group operations ───────────────────────────────────────────

/**
 * Fetches groups for an organization with their child elements and tags.
 */
export async function fetchGroupsWithRelations(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('location_groups')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;

    const groupIds = (data || []).map((g: GroupRow) => g.id);
    if (groupIds.length === 0) return [];

    const [elementsRes, tagsRes] = await Promise.all([
      supabase.from('location_elements').select('*').in('parent_id', groupIds),
      supabase.from('location_group_tags').select('*, location_tags(*)').in('group_id', groupIds)
    ]);

    if (elementsRes.error) throw elementsRes.error;
    if (tagsRes.error) throw tagsRes.error;

    const elementsByGroup = (elementsRes.data || []).reduce((acc: Record<string, ElementRow[]>, e: ElementRow & { parent_id: string }) => {
      (acc[e.parent_id] = acc[e.parent_id] || []).push(e);
      return acc;
    }, {});

    const tagsByGroup = (tagsRes.data || []).reduce((acc: Record<string, { id: string; name: string; color: string }[]>, gt: GroupTagJoin) => {
      (acc[gt.group_id] = acc[gt.group_id] || []).push(gt.location_tags);
      return acc;
    }, {} as Record<string, { id: string; name: string; color: string }[]>);

    const result = (data || []).map((group: GroupRow) => ({
      ...group,
      elements: elementsByGroup[group.id] || [],
      tags: tagsByGroup[group.id] || []
    }));

    log.info('Groups with relations fetched', { organizationId, count: result.length });
    return result;
  } catch (err) {
    log.error('Failed to fetch groups with relations', { organizationId, error: err });
    throw err;
  }
}

/**
 * Saves (create or update) a group with its element assignments and tags.
 */
export async function saveGroup(params: {
  id?: string;
  name: string;
  description: string | null;
  organization_id: string;
  selectedElements: string[];
  selectedTags: string[];
}) {
  try {
    let groupId: string;

    if (params.id) {
      const groupData: GroupUpdate = {
        name: params.name,
        description: params.description,
        organization_id: params.organization_id,
      };
      const { error } = await supabase
        .from('location_groups')
        .update(groupData)
        .eq('id', params.id);
      if (error) throw error;
      groupId = params.id;
    } else {
      const groupData: GroupInsert = {
        name: params.name,
        description: params.description,
        organization_id: params.organization_id,
      };
      const { data, error } = await supabase
        .from('location_groups')
        .insert(groupData)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('No data returned from group insert');
      groupId = data.id;
    }

    // Update element assignments
    const detachUpdate: ElementUpdate = { parent_id: null };
    await supabase
      .from('location_elements')
      .update(detachUpdate)
      .eq('parent_id', groupId);

    if (params.selectedElements.length > 0) {
      const attachUpdate: ElementUpdate = { parent_id: groupId };
      const { error: elementError } = await supabase
        .from('location_elements')
        .update(attachUpdate)
        .in('id', params.selectedElements);
      if (elementError) throw elementError;
    }

    // Update tags
    await supabase
      .from('location_group_tags')
      .delete()
      .eq('group_id', groupId);

    if (params.selectedTags.length > 0) {
      const tagInserts: GroupTagInsert[] = params.selectedTags.map(tagId => ({
        group_id: groupId,
        tag_id: tagId,
      }));
      const { error: tagError } = await supabase
        .from('location_group_tags')
        .insert(tagInserts);
      if (tagError) throw tagError;
    }

    log.info('Group saved', { groupId, isUpdate: !!params.id });
    return groupId;
  } catch (err) {
    log.error('Failed to save group', { error: err });
    throw err;
  }
}

/**
 * Deletes a group by ID.
 */
export async function deleteGroup(groupId: string) {
  try {
    const { error } = await supabase
      .from('location_groups')
      .delete()
      .eq('id', groupId);
    if (error) throw error;
    log.info('Group deleted', { groupId });
  } catch (err) {
    log.error('Failed to delete group', { groupId, error: err });
    throw err;
  }
}

// ─── Tags operations ────────────────────────────────────────────

/**
 * Fetches location tags for an organization.
 */
export async function fetchLocationTags(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('location_tags')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    if (error) throw error;
    log.info('Location tags fetched', { organizationId, count: data?.length ?? 0 });
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch location tags', { organizationId, error: err });
    throw err;
  }
}

/**
 * Updates an existing location tag.
 */
export async function updateLocationTag(tagId: string, params: { name: string; color: string; organization_id: string }) {
  try {
    const { error } = await supabase
      .from('location_tags')
      .update({ name: params.name, color: params.color, organization_id: params.organization_id })
      .eq('id', tagId);
    if (error) throw error;
    log.info('Location tag updated', { tagId });
  } catch (err) {
    log.error('Failed to update location tag', { tagId, error: err });
    throw err;
  }
}

/**
 * Deletes a location tag by ID.
 */
export async function deleteLocationTag(tagId: string) {
  try {
    const { error } = await supabase
      .from('location_tags')
      .delete()
      .eq('id', tagId);
    if (error) throw error;
    log.info('Location tag deleted', { tagId });
  } catch (err) {
    log.error('Failed to delete location tag', { tagId, error: err });
    throw err;
  }
}

/**
 * Creates a new location tag.
 */
export async function createLocationTag(params: { name: string; color: string; organization_id: string }) {
  try {
    const tagData: TagInsert = {
      name: params.name,
      color: params.color,
      organization_id: params.organization_id,
    };
    const { data, error } = await supabase
      .from('location_tags')
      .insert(tagData)
      .select()
      .maybeSingle();
    if (error) throw error;
    log.info('Location tag created', { id: data?.id });
    return data;
  } catch (err) {
    log.error('Failed to create location tag', { error: err });
    throw err;
  }
}

/**
 * Fetches groups for an organization (flat list, no relations).
 */
export async function fetchGroupsByOrganization(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('location_groups')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch groups by organization', { organizationId, error: err });
    throw err;
  }
}

/**
 * Fetches elements for an organization (flat list, no relations).
 */
export async function fetchElementsByOrganization(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('location_elements')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch elements by organization', { organizationId, error: err });
    throw err;
  }
}
