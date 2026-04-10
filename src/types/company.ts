/**
 * /src/types/company.ts
 *
 * Company and company-user types.
 * Replaces inline definitions in:
 *   components/admin/UserCompanyAffiliations.tsx,
 *   components/tickets/cockpit/SmartDispatcher.tsx
 */

export interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  siret: string | null;
  rating: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
}
