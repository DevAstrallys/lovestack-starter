/**
 * Shared types for the hierarchy sub-components.
 */

export interface HierarchyItem {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  tags?: Array<{ id: string; name: string; color: string }>;
  children?: { id: string; name: string; [key: string]: unknown }[];
}

export interface ChildItem {
  id: string;
  name: string;
}

export interface HierarchyFormData {
  name: string;
  description: string;
  selectedChildren: string[];
  selectedTags: string[];
}
