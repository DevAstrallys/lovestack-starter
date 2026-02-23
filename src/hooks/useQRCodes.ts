import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QRCode {
  id: string;
  building_id: string | null;
  location_element_id: string | null;
  location_group_id: string | null;
  location_ensemble_id: string | null;
  organization_id: string | null;
  display_label: string | null;
  target_slug: string | null;
  version: number;
  is_active: boolean;
  last_regenerated_at: string;
  created_at: string;
  form_config: any;
  created_by: string | null;
  // Relations
  location_elements?: { name: string };
  location_groups?: { name: string };
  location_ensembles?: { name: string };
}

export function useQRCodes(locationElementId?: string, buildingId?: string) {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [activeQR, setActiveQR] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQRCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('qr_codes')
        .select(`
          *,
          location_elements(name),
          location_groups(name), 
          location_ensembles(name)
        `)
        .order('version', { ascending: false });

      if (locationElementId) {
        query = query.eq('location_element_id', locationElementId);
      } else if (buildingId) {
        query = query.eq('building_id', buildingId).is('location_element_id', null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setQRCodes(data || []);
      
      // Find active QR code
      const active = data?.find(qr => qr.is_active) || null;
      setActiveQR(active);
    } catch (err) {
      console.error('Error loading QR codes:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des QR codes');
    } finally {
      setLoading(false);
    }
  }, [locationElementId, buildingId]);

  const createQRCode = async (qrData: Partial<QRCode>) => {
    try {
      // Disable any existing active QR code for this location
      if (locationElementId || buildingId) {
        let updateQuery = supabase
          .from('qr_codes')
          .update({ is_active: false });

        if (locationElementId) {
          updateQuery = updateQuery.eq('location_element_id', locationElementId);
        } else if (buildingId) {
          updateQuery = updateQuery.eq('building_id', buildingId).is('location_element_id', null);
        }

        await updateQuery.eq('is_active', true);
      }

      const { data, error: createError } = await supabase
        .from('qr_codes')
        .insert({
          ...qrData,
          version: 1,
          is_active: true,
          last_regenerated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      await loadQRCodes();
      return data;
    } catch (err) {
      console.error('Error creating QR code:', err);
      throw err;
    }
  };

  const regenerateQRCode = async (qrId: string) => {
    try {
      const { data, error: regenerateError } = await supabase.rpc('regenerate_qr_code', {
        qr_id: qrId
      });

      if (regenerateError) throw regenerateError;

      await loadQRCodes();
      return data;
    } catch (err) {
      console.error('Error regenerating QR code:', err);
      throw err;
    }
  };

  const deactivateQRCode = async (qrId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('qr_codes')
        .update({ is_active: false })
        .eq('id', qrId);

      if (updateError) throw updateError;

      await loadQRCodes();
    } catch (err) {
      console.error('Error deactivating QR code:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  return {
    qrCodes,
    activeQR,
    loading,
    error,
    createQRCode,
    regenerateQRCode,
    deactivateQRCode,
    refresh: loadQRCodes
  };
}

export function useQRCodeBySlug(slug: string) {
  const [qrCode, setQRCode] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQRCode = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // Use the restricted public view (excludes created_by, building_id)
        const { data, error: fetchError } = await supabase
          .from('qr_codes_public' as any)
          .select('*')
          .eq('target_slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        if (!data) {
          setError('QR code non trouvé ou inactif');
          return;
        }

        setQRCode(data as unknown as QRCode);
      } catch (err) {
        console.error('Error loading QR code by slug:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du QR code');
      } finally {
        setLoading(false);
      }
    };

    loadQRCode();
  }, [slug]);

  return { qrCode, loading, error };
}