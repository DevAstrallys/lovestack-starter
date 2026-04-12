/**
 * /src/services/system/index.ts
 * System-level queries (stats, settings, audit logs).
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:system');

export async function fetchSystemStats() {
  try {
    const [usersRes, orgsRes, ticketsRes, activeRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }),
      supabase.from('memberships').select('user_id', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    const stats = {
      usersCount: usersRes.count ?? 0,
      organizationsCount: orgsRes.count ?? 0,
      ticketsCount: ticketsRes.count ?? 0,
      activeUsersCount: activeRes.count ?? 0,
    };
    log.info('System stats fetched', stats);
    return stats;
  } catch (err) {
    log.error('Failed to fetch system stats', { error: err });
    throw err;
  }
}

export async function fetchAuditLogs(options?: { entities?: string[]; limit?: number }) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 50);

    if (options?.entities && options.entities.length > 0) {
      query = query.in('entity', options.entities);
    }

    const { data, error } = await query;
    if (error) throw error;
    log.info('Audit logs fetched', { count: data?.length ?? 0 });
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch audit logs', { error: err });
    throw err;
  }
}
