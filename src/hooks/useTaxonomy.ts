import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TaxAction {
  id: string;
  label: string;
  key: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface TaxCategory {
  id: string;
  action_id: string;
  label: string;
  key: string;
}

export interface TaxObject {
  id: string;
  category_id: string;
  label: string;
  key: string;
  urgency_level?: number;
  is_private?: boolean;
}

export interface TaxDetail {
  id: string;
  object_id: string;
  label: string;
  key: string;
  urgency_level: number;
  is_private: boolean;
}

export interface LocationOverride {
  category_overrides: Record<string, boolean>;
  object_overrides: Record<string, boolean>;
  custom_objects: Array<{ category_id: string; label: string }>;
}

export function useTaxonomy(locationId?: string) {
  const [actions, setActions] = useState<TaxAction[]>([]);
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [objects, setObjects] = useState<TaxObject[]>([]);
  const [details, setDetails] = useState<TaxDetail[]>([]);
  const [overrides, setOverrides] = useState<LocationOverride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTaxonomy();
  }, [locationId]);

  const loadTaxonomy = async () => {
    try {
      setLoading(true);
      setError(null);

      const [actionsRes, categoriesRes, objectsRes, detailsRes] = await Promise.all([
        supabase.from('tax_actions').select('*').order('label'),
        supabase.from('tax_categories').select('*').order('label'),
        supabase.from('tax_objects').select('*').order('label'),
        supabase.from('tax_details').select('*').order('label')
      ]);

      if (actionsRes.error) throw actionsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (objectsRes.error) throw objectsRes.error;
      if (detailsRes.error) throw detailsRes.error;

      setActions(actionsRes.data || []);
      setCategories(categoriesRes.data || []);
      setObjects(objectsRes.data || []);
      setDetails(detailsRes.data || []);

      if (locationId) {
        await loadLocationOverrides(locationId);
      }
    } catch (err) {
      console.error('Error loading taxonomy:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadLocationOverrides = async (locId: string) => {
    try {
      const [categoryOverridesRes, objectOverridesRes, customObjectsRes] = await Promise.all([
        supabase.from('location_category_overrides').select('category_id, enabled').eq('location_id', locId),
        supabase.from('location_object_overrides').select('object_id, enabled').eq('location_id', locId),
        supabase.from('location_custom_objects').select('category_id, custom_label').eq('location_id', locId).eq('enabled', true)
      ]);

      const catOv: Record<string, boolean> = {};
      categoryOverridesRes.data?.forEach(o => { catOv[o.category_id] = o.enabled; });

      const objOv: Record<string, boolean> = {};
      objectOverridesRes.data?.forEach(o => { objOv[o.object_id] = o.enabled; });

      const custom = customObjectsRes.data?.map(o => ({ category_id: o.category_id, label: o.custom_label })) || [];

      setOverrides({ category_overrides: catOv, object_overrides: objOv, custom_objects: custom });
    } catch (err) {
      console.error('Error loading location overrides:', err);
    }
  };

  const getFilteredCategories = (actionId: string): TaxCategory[] => {
    const base = categories.filter(c => c.action_id === actionId);
    if (!overrides) return base;
    return base.filter(c => !(c.id in overrides.category_overrides) || overrides.category_overrides[c.id]);
  };

  const getFilteredObjects = (categoryId: string): Array<TaxObject | { id: string; label: string; isCustom: true }> => {
    let base = objects.filter(o => o.category_id === categoryId);
    if (overrides) {
      base = base.filter(o => !(o.id in overrides.object_overrides) || overrides.object_overrides[o.id]);
      const custom = overrides.custom_objects
        .filter(co => co.category_id === categoryId)
        .map(co => ({ id: `custom_${co.label}`, label: co.label, isCustom: true as const }));
      return [...base, ...custom];
    }
    return base;
  };

  const getFilteredDetails = (objectId: string): TaxDetail[] => {
    return details.filter(d => d.object_id === objectId);
  };

  return {
    actions, categories, objects, details,
    overrides, loading, error,
    getFilteredCategories, getFilteredObjects, getFilteredDetails,
    reload: loadTaxonomy
  };
}
