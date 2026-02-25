import { LocationTag, LocationElement } from '@/components/locations/LocationsManagement';

export type { LocationTag, LocationElement };

export interface ElementFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  qrLocation: string;
  selectedTags: string[];
}

export const defaultFormData: ElementFormData = {
  name: '',
  description: '',
  address: '',
  city: '',
  zipCode: '',
  country: 'France',
  qrLocation: '',
  selectedTags: [],
};
