import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Location {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
}

/**
 * Hook pour gérer les lieux accessibles à l'utilisateur
 */
export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;

      setLocations(data || []);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement des lieux');
    } finally {
      setLoading(false);
    }
  };

  return {
    locations,
    loading,
    error,
    reload: loadLocations
  };
}