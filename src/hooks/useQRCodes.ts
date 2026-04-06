import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import {
  fetchQRCodesByLocation,
  deactivateActiveQRCodesForLocation,
  createQRCode as createQRCodeService,
  regenerateQRCode as regenerateQRCodeService,
  updateQRCode,
} from '@/services/locations';
import { fetchQrCodeBySlug } from '@/services/tickets';

const log = createLogger('hook:useQRCodes');

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
  location_elements?: { name: string };
  location_groups?: { name: string };
  location_ensembles?: { name: string };
}

export function useQRCodes(locationElementId?: string) {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [activeQR, setActiveQR] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQRCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchQRCodesByLocation(locationElementId);
      setQRCodes(data as QRCode[]);
      const active = data.find(qr => qr.is_active) || null;
      setActiveQR(active as QRCode | null);
    } catch (err) {
      log.error('Error loading QR codes', { error: err });
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des QR codes');
    } finally {
      setLoading(false);
    }
  }, [locationElementId]);

  const createQRCode = async (qrData: Partial<QRCode>) => {
    try {
      if (locationElementId) {
        await deactivateActiveQRCodesForLocation(locationElementId);
      }

      const data = await createQRCodeService({
        display_label: qrData.display_label ?? '',
        target_slug: qrData.target_slug ?? '',
        organization_id: qrData.organization_id ?? '',
        created_by: qrData.created_by ?? undefined,
        location_element_id: qrData.location_element_id,
        location_group_id: qrData.location_group_id,
        location_ensemble_id: qrData.location_ensemble_id,
        form_config: qrData.form_config ?? {},
      });

      await loadQRCodes();
      return data;
    } catch (err) {
      log.error('Error creating QR code', { error: err });
      throw err;
    }
  };

  const regenerateQRCode = async (qrId: string) => {
    try {
      const data = await regenerateQRCodeService(qrId);
      await loadQRCodes();
      return data;
    } catch (err) {
      log.error('Error regenerating QR code', { error: err });
      throw err;
    }
  };

  const deactivateQRCode = async (qrId: string) => {
    try {
      await updateQRCode(qrId, { is_active: false });
      await loadQRCodes();
    } catch (err) {
      log.error('Error deactivating QR code', { error: err });
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
    refresh: loadQRCodes,
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

        const data = await fetchQrCodeBySlug(slug);

        if (!data) {
          setError('QR code non trouvé ou inactif');
          return;
        }

        setQRCode(data as unknown as QRCode);
      } catch (err) {
        log.error('Error loading QR code by slug', { slug, error: err });
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du QR code');
      } finally {
        setLoading(false);
      }
    };

    loadQRCode();
  }, [slug]);

  return { qrCode, loading, error };
}
