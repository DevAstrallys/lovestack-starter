import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBaseUrl, openExternalLink } from '@/lib/navigation';
import { createLogger } from '@/lib/logger';
import { createQRCode as createQRCodeService } from '@/services/locations';
import { LocationTag, LocationElement, ElementFormData, defaultFormData } from './types';

const log = createLogger('hook:locationElements');

export function useLocationElements(organizationId: string) {
  const [elements, setElements] = useState<LocationElement[]>([]);
  const [availableTags, setAvailableTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchElements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('location_elements' as any)
        .select(`*, location_element_tags ( location_tags (*) )`)
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;

      const elementsWithTags = (data || []).map((element: any) => ({
        ...element,
        tags: element.location_element_tags?.map((et: any) => et.location_tags) || [],
      }));

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
      const { data, error } = await supabase
        .from('location_tags' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setAvailableTags((data as any) || []);
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

    let elementId: string;

    if (editingElement) {
      const { error } = await supabase.from('location_elements' as any).update(elementData).eq('id', editingElement.id);
      if (error) throw error;
      elementId = editingElement.id;
    } else {
      const { data, error } = await supabase.from('location_elements' as any).insert(elementData).select().maybeSingle();
      if (error) throw error;
      elementId = (data as any).id;
    }

    // Update tags
    await supabase.from('location_element_tags' as any).delete().eq('element_id', elementId);

    if (formData.selectedTags.length > 0) {
      const tagInserts = formData.selectedTags.map((tagId) => ({ element_id: elementId, tag_id: tagId }));
      const { error: tagError } = await supabase.from('location_element_tags' as any).insert(tagInserts);
      if (tagError) throw tagError;
    }

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
      const { error } = await supabase.from('location_elements' as any).delete().eq('id', elementId);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Élément supprimé' });
      fetchElements();
    } catch (error) {
      log.error('Error deleting element', { elementId, error });
      toast({ title: 'Erreur', description: "Impossible de supprimer l'élément", variant: 'destructive' });
    }
  };

  const generateQRCode = async (elementId: string, elementName: string) => {
    try {
      const element = elements.find((e) => e.id === elementId);
      const locationData = element?.location_data as any;

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
      const { data, error } = await supabase
        .from('location_tags' as any)
        .insert({ name, color, organization_id: organizationId })
        .select()
        .maybeSingle();

      if (error) throw error;

      const newTag: LocationTag = {
        id: (data as any).id,
        name: (data as any).name,
        color: (data as any).color,
        organization_id: (data as any).organization_id,
        created_at: (data as any).created_at,
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
