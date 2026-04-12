/**
 * /src/types/location.ts
 *
 * Location hierarchy types: ensemble → group → element.
 * Replaces inline definitions in:
 *   hooks/useLocations.ts, components/locations/LocationsManagement.tsx,
 *   components/locations/LocationEnsembles.tsx, LocationGroups.tsx,
 *   components/admin/AccessSecurityManager.tsx
 */

// ── LocationData (JSON stored in location_elements.location_data) ────

/** Structure attendue du champ JSON location_data sur les éléments */
export interface LocationData {
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  qrLocation?: string;
  floor?: string;
  door?: string;
  lot_number?: string;
  [key: string]: unknown;
}

// ── Tag ──────────────────────────────────────────────────────────────

export interface LocationTag {
  id: string;
  name: string;
  color: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Element (leaf node — apartment, room, technical area…) ───────────

export interface LocationElement {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  organization_id: string | null;
  location_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  /** Joined tags — populated by queries, not stored directly */
  tags?: LocationTag[];
}

// ── Group (building, staircase, floor…) ──────────────────────────────

export interface LocationGroup {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  /** Joined tags — populated by queries */
  tags?: LocationTag[];
  /** Joined children — populated by queries */
  elements?: LocationElement[];
}

// ── Ensemble (top-level — résidence, site, portfolio…) ───────────────

export interface LocationEnsemble {
  id: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  /** Joined tags — populated by queries */
  tags?: LocationTag[];
  /** Joined children — populated by queries */
  groups?: LocationGroup[];
}

// ── Full hierarchy (used for tree views and navigation) ──────────────

export interface LocationHierarchy {
  ensembles: LocationEnsemble[];
  groups: LocationGroup[];
  elements: LocationElement[];
}
