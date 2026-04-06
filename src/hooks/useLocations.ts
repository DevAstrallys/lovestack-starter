import { useState, useEffect } from 'react';
import { fetchAccessibleLocationElements } from '@/services/locations';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook:useLocations');

export interface Location {
  id: string;
  name: string;
  description: string | null;
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

      const data = await fetchAccessibleLocationElements();
      setLocations(data);
    } catch (err) {
      log.error('Error loading locations', { error: err });
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
