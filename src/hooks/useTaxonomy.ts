/**
 * /src/hooks/useTaxonomy.ts
 *
 * Hook for loading and filtering taxonomy data.
 * REFACTORED: uses services/taxonomy instead of direct supabase calls.
 * Types imported from @/types instead of inline definitions.
 */
import { useState, useEffect } from "react";
import { createLogger } from "@/lib/logger";
import { fetchAllTaxonomy, fetchLocationOverrides } from "@/services/taxonomy";
import type { TaxAction, TaxCategory, TaxObject, TaxDetail } from "@/types";

const log = createLogger("hook:useTaxonomy");

export type { TaxAction, TaxCategory, TaxObject, TaxDetail };

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

      const taxonomy = await fetchAllTaxonomy();

      setActions(taxonomy.actions);
      setCategories(taxonomy.categories);
      setObjects(taxonomy.objects);
      setDetails(taxonomy.details);

      if (locationId) {
        await loadLocationOverrides(locationId);
      }
    } catch (err) {
      log.error("Error loading taxonomy", { error: err });
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadLocationOverrides = async (locId: string) => {
    try {
      const overrideData = await fetchLocationOverrides(locId);

      const catOv: Record<string, boolean> = {};
      overrideData.categoryOverrides.forEach((o) => {
        catOv[o.category_id] = o.enabled;
      });

      const objOv: Record<string, boolean> = {};
      overrideData.objectOverrides.forEach((o) => {
        objOv[o.object_id] = o.enabled;
      });

      const custom = overrideData.customObjects.map((o) => ({
        category_id: o.category_id,
        label: o.custom_label,
      }));

      setOverrides({
        category_overrides: catOv,
        object_overrides: objOv,
        custom_objects: custom,
      });
    } catch (err) {
      log.error("Error loading location overrides", { locationId: locId, error: err });
    }
  };

  const getFilteredCategories = (actionId: string): TaxCategory[] => {
    const base = categories.filter((c) => c.action_id === actionId);
    if (!overrides) return base;
    return base.filter((c) => !(c.id in overrides.category_overrides) || overrides.category_overrides[c.id]);
  };

  const getFilteredObjects = (categoryId: string): Array<TaxObject | { id: string; label: string; isCustom: true }> => {
    let base = objects.filter((o) => o.category_id === categoryId);
    if (overrides) {
      base = base.filter((o) => !(o.id in overrides.object_overrides) || overrides.object_overrides[o.id]);
      const custom = overrides.custom_objects
        .filter((co) => co.category_id === categoryId)
        .map((co) => ({ id: `custom_${co.label}`, label: co.label, isCustom: true as const }));
      return [...base, ...custom];
    }
    return base;
  };

  const getFilteredDetails = (objectId: string): TaxDetail[] => {
    return details.filter((d) => d.object_id === objectId);
  };

  return {
    actions,
    categories,
    objects,
    details,
    overrides,
    loading,
    error,
    getFilteredCategories,
    getFilteredObjects,
    getFilteredDetails,
    reload: loadTaxonomy,
  };
}
