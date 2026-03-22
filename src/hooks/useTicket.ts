import { useState, useEffect, useCallback } from 'react';
import { fetchTicketById, fetchBuildings, fetchOrganizations } from '@/services/tickets';
import { Ticket } from '@/hooks/useTickets';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook:ticket');

export function useTicket(id: string | undefined) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTicketById(id);
      const t: Ticket = {
        ...data,
        attachments: Array.isArray(data.attachments)
          ? data.attachments
          : typeof data.attachments === 'string'
          ? JSON.parse(data.attachments)
          : [],
      };

      // Enrich with building & org name
      if (t.building_id) {
        const buildings = await fetchBuildings([t.building_id]);
        const building = buildings?.[0];
        if (building) {
          t.building_name = building.name;
          if (building.organization_id) {
            const orgs = await fetchOrganizations([building.organization_id]);
            if (orgs?.[0]) t.organization_name = orgs[0].name;
          }
        }
      }
      if (!t.organization_name && (t.organization_id || (t.meta as any)?.organization_id)) {
        const oid = t.organization_id || (t.meta as any)?.organization_id;
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
