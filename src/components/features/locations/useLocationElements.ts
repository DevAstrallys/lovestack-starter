import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getBaseUrl, openExternalLink } from '@/lib/navigation';
import { createLogger } from '@/lib/logger';
import { createQRCode as createQRCodeService } from '@/services/locations';
import {
  saveElementWithTags,
  deleteElement as deleteElementService,
  fetchElements as fetchElementsService,
  fetchAvailableTags as fetchAvailableTagsService,
  createTag as createTagService,
} from '@/services/locations/elements';
import { LocationTag, LocationElement, ElementFormData, defaultFormData } from './types';

const log = createLogger('hook:locationElements');

export function useLocationElements(organizationId: string) {
  const [elements, setElements] = useState<LocationElement[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchElements = useCallback(async () => {
    try {
      const elementsWithTags = await fetchElementsService(organizationId);
      setElements(elementsWithTags);
    } catch (error) {
      log.error('Error fetching elements', { error });
      toast({ title: 'Erreur', description: 'Impossible de charger les éléments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organizationId, toast]);

  const fetchAvailableTags = useCallback(async () => {
    try {
      const tags = await fetchAvailableTagsService(organizationId);
      setAvailableTags(tags);
    } catch (error) {
      log.error('Error fetching tags', { error });
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchElements();
      fetchAvailableTags();
    }
  }, [organizationId, fetchElements, fetchAvailableTags]);

  const saveElement = async (formData: ElementFormData, editingElement: LocationElement | null) => {
    const locationData = {
      address: formData.address,
      city: formData.city,
      zipCode: formData.zipCode,
      country: formData.country,
      qrLocation: formData.qrLocation,
    };

    const elementData = {
      name: formData.name,
      description: formData.description || null,
      location_data: Object.values(locationData).some((v) => v.trim()) ? locationData : null,
      organization_id: organizationId,
    };

    const elementId = await saveElementWithTags(
      elementData,
      formData.selectedTags,
      editingElement?.id,
    );

    if (!elementId) throw new Error('Failed to save element');

    // Auto-generate QR code for new elements
    if (!editingElement) {
      try {
        if (!organizationId) {
          log.warn('Skipping QR code auto-generation: no organization_id', { elementId });
        } else {
          await createQRCodeService({
            location_element_id: elementId,
            display_label: `QR Code - ${formData.name}`,
            target_slug: `element-${elementId}-${Date.now()}`,
            organization_id: organizationId,
            location: { description: formData.qrLocation || 'Localisation non spécifiée' },
          });
        }
      } catch (qrError) {
        log.error('Error auto-generating QR code', { elementId, error: qrError });
      }
    }

    toast({ title: 'Succès', description: editingElement ? 'Élément modifié' : 'Élément créé avec QR code généré' });
    await fetchElements();
    return elementId;
  };

  const deleteElement = async (elementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    try {
      await deleteElementService(elementId);
      toast({ title: 'Succès', description: 'Élément supprimé' });
      fetchElements();
    } catch (error) {
      log.error('Error deleting element', { elementId, error });
      toast({ title: 'Erreur', description: "Impossible de supprimer l'élément", variant: 'destructive' });
    }
  };

  const generateQRCode = async (elementId: string, elementName: string) => {
    try {
      if (!organizationId) {
        log.warn('generateQRCode: no organizationId', { elementId });
        toast({ title: 'Erreur', description: 'Organisation non sélectionnée. Veuillez sélectionner une organisation.', variant: 'destructive' });
        return;
      }

      const element = elements.find((e) => e.id === elementId);
      const locationData = element?.location_data as Record<string, unknown> | null | undefined;

      log.info('generateQRCode: calling service', { elementId, organizationId });

      const data = await createQRCodeService({
        location_element_id: elementId,
        display_label: `QR Code - ${elementName}`,
        target_slug: `element-${elementId}-${Date.now()}`,
        organization_id: organizationId,
        location: { description: locationData?.qrLocation || 'Localisation non spécifiée' },
      });

      toast({ title: 'Succès', description: `QR Code généré pour ${elementName}` });
      const qrUrl = `${getBaseUrl()}/ticket-form/${data.target_slug}`;
      openExternalLink(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`);
    } catch (error) {
      log.error('Error generating QR code', { elementId, error });
      toast({ title: 'Erreur', description: 'Impossible de générer le QR code', variant: 'destructive' });
    }
  };

  const createTag = async (name: string, color: string) => {
    try {
      const data = await createTagService(name, color, organizationId);

      const newTag: LocationTag = {
        id: data.id,
        name: data.name,
        color: data.color,
        organization_id: data.organization_id,
        created_at: data.created_at,
        updated_at: data.updated_at ?? data.created_at,
      };

      setAvailableTags((prev) => [...prev, newTag]);
      toast({ title: 'Succès', description: 'Tag créé avec succès' });
    } catch (error) {
      log.error('Error creating tag', { error });
      toast({ title: 'Erreur', description: 'Impossible de créer le tag', variant: 'destructive' });
    }
  };

  return {
    elements,
    availableTags,
    loading,
    saveElement,
    deleteElement,
    generateQRCode,
    createTag,
  };
}
