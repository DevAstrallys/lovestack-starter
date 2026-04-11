/**
 * /src/services/companies/index.ts
 *
 * Companies service — CRUD for companies and company-user affiliations.
 * Absorbs direct supabase calls from:
 *   components/admin/UserCompanyAffiliations.tsx
 *   components/tickets/cockpit/SmartDispatcher.tsx
 *
 * Note: replaces the partial implementation in services/organizations/index.ts
 * which will be cleaned up to only handle organization-specific operations.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import type { Company, CompanyUser } from '@/types';

const log = createLogger('service:companies');

// ── Companies ────────────────────────────────────────────────────────

export async function fetchCompanies(): Promise<Company[]> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data ?? []) as Company[];
  } catch (err) {
    log.error('Failed to fetch companies', { error: err });
    return [];
  }
}

export async function createCompany(name: string): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert({ name: name.trim() })
      .select('*')
      .single();
    if (error) throw error;
    log.info('Company created', { name });
    return data as Company;
  } catch (err) {
    log.error('Failed to create company', { name, error: err });
    throw err;
  }
}

// ── Company-User affiliations ────────────────────────────────────────

export async function fetchCompanyUsersByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('company_users')
      .select('id, company_id, role, created_at, companies(id, name, email, phone, address, city, tags)')
      .eq('user_id', userId);
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch company users', { userId, error: err });
    return [];
  }
}

interface AffiliateUserParams {
  user_id: string;
  company_id: string;
  role?: string;
}

export async function affiliateUserToCompany(params: AffiliateUserParams) {
  try {
    const { error } = await supabase.from('company_users').insert({
      user_id: params.user_id,
      company_id: params.company_id,
      role: params.role ?? null,
    });
    if (error) throw error;
    log.info('User affiliated to company', {
      userId: params.user_id,
      companyId: params.company_id,
    });
  } catch (err) {
    log.error('Failed to affiliate user to company', { error: err });
    throw err;
  }
}

export async function removeCompanyUser(companyUserId: string) {
  try {
    const { error } = await supabase
      .from('company_users')
      .delete()
      .eq('id', companyUserId);
    if (error) throw error;
    log.info('Company user removed', { companyUserId });
  } catch (err) {
    log.error('Failed to remove company user', { companyUserId, error: err });
    throw err;
  }
}

/**
 * Create a company and immediately affiliate a user to it.
 * Used when adding a new company from the affiliations panel.
 */
export async function createCompanyAndAffiliate(
  companyName: string,
  userId: string,
  role?: string,
): Promise<Company | null> {
  try {
    const company = await createCompany(companyName);
    if (!company) return null;
    await affiliateUserToCompany({
      user_id: userId,
      company_id: company.id,
      role,
    });
    return company;
  } catch (err) {
    log.error('Failed to create company and affiliate', { companyName, userId, error: err });
    throw err;
  }
}

/**
 * Search company users with profile and company info (for dispatcher contact search).
 */
export async function searchCompanyContacts(query: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('company_users')
      .select('user_id, role, companies(id, name, email), profiles:user_id(full_name, phone)')
      .limit(limit) as any;
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    log.error('Failed to search company contacts', { query, error: err });
    return [];
  }
}
