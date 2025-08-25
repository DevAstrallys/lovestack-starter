import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TaxAction {
  id: string;
  label: string;
  key: string;
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
}

export interface LocationOverride {
  category_overrides: Record<string, boolean>;
  object_overrides: Record<string, boolean>;
  custom_objects: Array<{
    category_id: string;
    label: string;
  }>;
}

/**
 * Hook pour charger et gérer la taxonomie des tickets
 * Inclut la gestion des overrides par lieu selon le cahier des charges
 */
export function useTaxonomy(locationId?: string) {
  const [actions, setActions] = useState<TaxAction[]>([]);
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [objects, setObjects] = useState<TaxObject[]>([]);
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

      // Charger la taxonomie de base
      const [actionsRes, categoriesRes, objectsRes] = await Promise.all([
        supabase.from('tax_actions').select('*').order('label'),
        supabase.from('tax_categories').select('*').order('label'),
        supabase.from('tax_objects').select('*').order('label')
      ]);

      if (actionsRes.error) throw actionsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (objectsRes.error) throw objectsRes.error;

      setActions(actionsRes.data || []);
      setCategories(categoriesRes.data || []);
      setObjects(objectsRes.data || []);

      // Si on a un lieu spécifique, charger les overrides
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

  const loadLocationOverrides = async (locationId: string) => {
    try {
      const [categoryOverridesRes, objectOverridesRes, customObjectsRes] = await Promise.all([
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
          .eq('enabled', true)
      ]);

      const categoryOverrides: Record<string, boolean> = {};
      categoryOverridesRes.data?.forEach(override => {
        categoryOverrides[override.category_id] = override.enabled;
      });

      const objectOverrides: Record<string, boolean> = {};
      objectOverridesRes.data?.forEach(override => {
        objectOverrides[override.object_id] = override.enabled;
      });

      const customObjects = customObjectsRes.data?.map(obj => ({
        category_id: obj.category_id,
        label: obj.custom_label
      })) || [];

      setOverrides({
        category_overrides: categoryOverrides,
        object_overrides: objectOverrides,
        custom_objects: customObjects
      });
    } catch (err) {
      console.error('Error loading location overrides:', err);
    }
  };

  /**
   * Filtre les catégories selon l'action sélectionnée et les overrides du lieu
   */
  const getFilteredCategories = (actionId: string): TaxCategory[] => {
    const baseCategories = categories.filter(cat => cat.action_id === actionId);
    
    if (!overrides) return baseCategories;

    return baseCategories.filter(cat => {
      // Si un override existe et est false, on masque la catégorie
      if (cat.id in overrides.category_overrides) {
        return overrides.category_overrides[cat.id];
      }
      // Par défaut, on affiche la catégorie
      return true;
    });
  };

  /**
   * Filtre les objets selon la catégorie sélectionnée et les overrides du lieu
   * Inclut les objets personnalisés du lieu
   */
  const getFilteredObjects = (categoryId: string): Array<TaxObject | { id: string; label: string; isCustom: true }> => {
    const baseObjects = objects.filter(obj => obj.category_id === categoryId);
    
    let filteredObjects = baseObjects;
    
    if (overrides) {
      // Filtrer selon les overrides
      filteredObjects = baseObjects.filter(obj => {
        if (obj.id in overrides.object_overrides) {
          return overrides.object_overrides[obj.id];
        }
        return true;
      });

      // Ajouter les objets personnalisés du lieu
      const customObjects = overrides.custom_objects
        .filter(customObj => customObj.category_id === categoryId)
        .map(customObj => ({
          id: `custom_${customObj.label}`,
          label: customObj.label,
          isCustom: true as const
        }));

      return [...filteredObjects, ...customObjects];
    }

    return filteredObjects;
  };

  return {
    actions,
    categories,
    objects,
    overrides,
    loading,
    error,
    getFilteredCategories,
    getFilteredObjects,
    reload: loadTaxonomy
  };
}