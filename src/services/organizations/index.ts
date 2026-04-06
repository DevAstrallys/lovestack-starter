/**
 * Organizations service — companies and company-user affiliations.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:organizations');

/**
 * Fetch all companies visible to the current user.
 */
export async function fetchCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, email, phone, address, city, tags');
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error('Failed to fetch companies', { error: err });
    throw err;
  }
}

/**
 * Fetch company_users for a specific user, with joined company data.
 */
export async function fetchCompanyUsersByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('company_users')
      .select('id, company_id, role, companies(id, name, email, phone, address, city, tags)')
      .eq('user_id', userId) as any;
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error('Failed to fetch company users', { userId, error: err });
    throw err;
  }
}
