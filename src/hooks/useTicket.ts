import { useState, useEffect, useCallback } from 'react';
import { fetchTicketById, fetchOrganizations } from '@/services/tickets';
import type { EnrichedTicket } from '@/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook:ticket');

export function useTicket(id: string | undefined) {
  const [ticket, setTicket] = useState<EnrichedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTicketById(id);
      const t = {
        ...data,
        attachments: Array.isArray(data.attachments)
          ? data.attachments
          : typeof data.attachments === 'string'
          ? JSON.parse(data.attachments)
          : [],
        location: (typeof data.location === 'string' ? JSON.parse(data.location) : data.location) ?? null,
      } as EnrichedTicket;

      // Enrich with org name
      if (t.organization_id) {
        const orgs = await fetchOrganizations([t.organization_id]);
        if (orgs?.[0]) t.organization_name = orgs[0].name;
      }
      if (!t.organization_name && (t.organization_id || t.meta?.organization_id)) {
        const oid = t.organization_id || (t.meta?.organization_id as string);
        const orgs = await fetchOrganizations([oid]);
        if (orgs?.[0]) t.organization_name = orgs[0].name;
      }

      setTicket(t);
    } catch (err) {
      log.error('Error loading ticket', err);
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { ticket, loading, error, refresh: load };
}
