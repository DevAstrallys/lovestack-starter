import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket } from '@/hooks/useTickets';

export function useTicket(id: string | undefined) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;
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
        const { data: building } = await supabase
          .from('buildings')
          .select('name, organization_id')
          .eq('id', t.building_id)
          .single();
        if (building) {
          t.building_name = building.name;
          if (building.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', building.organization_id)
              .single();
            if (org) t.organization_name = org.name;
          }
        }
      }
      if (!t.organization_name && (t.organization_id || (t.meta as any)?.organization_id)) {
        const oid = t.organization_id || (t.meta as any)?.organization_id;
        const { data: org } = await supabase.from('organizations').select('name').eq('id', oid).single();
        if (org) t.organization_name = org.name;
      }

      setTicket(t);
    } catch (err) {
      console.error('Error loading ticket:', err);
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { ticket, loading, error, refresh: load };
}
