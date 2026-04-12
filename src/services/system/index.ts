/**
 * /src/services/system/index.ts
 * System-level queries (stats, settings, audit logs).
 * Absorbs calls from: components/admin/SystemSettings.tsx, AccessSecurityManager.tsx
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:system');

export async function fetchSystemStats() {
  try {
    const [usersRes, orgsRes, ticketsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }),
    ]);
    const stats = {
      usersCount: usersRes.count ?? 0,
      organizationsCount: orgsRes.count ?? 0,
      ticketsCount: ticketsRes.count ?? 0,
    };
    log.info('System stats fetched', stats);
    return stats;
  } catch (err) {
    log.error('Failed to fetch system stats', { error: err });
    throw err;
  }
}

export async function fetchAuditLogs(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    log.info('Audit logs fetched', { count: data?.length ?? 0 });
    return data ?? [];
  } catch (err) {
    log.error('Failed to fetch audit logs', { error: err });
    throw err;
  }
}
