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
      setTicket({
        ...data,
        attachments: Array.isArray(data.attachments)
          ? data.attachments
          : typeof data.attachments === 'string'
          ? JSON.parse(data.attachments)
          : [],
      });
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
