/**
 * /src/services/locations/elements.ts
 *
 * Location elements CRUD operations.
 * Absorbs direct supabase calls from:
 *   components/features/locations/useLocationElements.ts
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';

const log = createLogger('service:locations:elements');

interface ElementData {
  name: string;
  description?: string | null;
  parent_id?: string | null;
  organization_id?: string | null;
  location_data?: Json | null;
}

/**
 * Create or update a location element.
 * Returns the created/updated element ID.
 */
export async function saveElement(
  data: ElementData,
  elementId?: string,
): Promise<string | null> {
  try {
    if (elementId) {
      const { error } = await supabase
        .from('location_elements')
        .update(data)
        .eq('id', elementId);
      if (error) throw error;
      log.info('Element updated', { elementId });
      return elementId;
    }

    const { data: created, error } = await supabase
      .from('location_elements')
      .insert(data)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    const newId = created?.id ?? null;
    log.info('Element created', { elementId: newId });
    return newId;
  } catch (err) {
    log.error('Failed to save element', { error: err });
    throw err;
  }
}

/**
 * Delete a location element by ID.
 */
export async function deleteElement(elementId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('location_elements')
      .delete()
      .eq('id', elementId);
    if (error) throw error;
    log.info('Element deleted', { elementId });
  } catch (err) {
    log.error('Failed to delete element', { elementId, error: err });
    throw err;
  }
}

/**
 * Replace all tags for an element.
 * Deletes existing tags then inserts new ones.
 */
export async function replaceElementTags(
  elementId: string,
  tagIds: string[],
): Promise<void> {
  try {
    await supabase
      .from('location_element_tags')
      .delete()
      .eq('element_id', elementId);

    if (tagIds.length > 0) {
      const tagInserts = tagIds.map((tagId) => ({
        element_id: elementId,
        tag_id: tagId,
      }));
      const { error } = await supabase
        .from('location_element_tags')
        .insert(tagInserts);
      if (error) throw error;
    }

    log.info('Element tags replaced', { elementId, tagCount: tagIds.length });
  } catch (err) {
    log.error('Failed to replace element tags', { elementId, error: err });
    throw err;
  }
}

/**
 * Save an element and its tags in one operation.
 */
export async function saveElementWithTags(
  data: ElementData,
  tagIds: string[],
  elementId?: string,
): Promise<string | null> {
  const savedId = await saveElement(data, elementId);
  if (savedId) {
    await replaceElementTags(savedId, tagIds);
  }
  return savedId;
}

/**
 * Fetch all elements for an organization, with joined tags.
 */
export async function fetchElements(organizationId: string) {
  const { data, error } = await supabase
    .from('location_elements')
    .select(`*, location_element_tags ( location_tags (*) )`)
    .eq('organization_id', organizationId)
    .order('name');

  if (error) throw error;

  return (data || []).map((element: any) => ({
    ...element,
    tags: element.location_element_tags?.map((et: any) => et.location_tags) || [],
  }));
}

/**
 * Fetch all tags for an organization.
 */
export async function fetchAvailableTags(organizationId: string) {
  const { data, error } = await supabase
    .from('location_tags')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Create a new tag for an organization.
 */
export async function createTag(
  name: string,
  color: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from('location_tags')
    .insert({ name, color, organization_id: organizationId })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}
