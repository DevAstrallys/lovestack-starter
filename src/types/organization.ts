/**
 * /src/types/organization.ts
 *
 * Organization and white-label types.
 * Replaces inline definitions in:
 *   contexts/OrganizationContext.tsx, contexts/WhiteLabelContext.tsx,
 *   components/admin/OrganizationsManagement.tsx
 */

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  country: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhiteLabelConfig {
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
}
