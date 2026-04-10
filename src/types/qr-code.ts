/**
 * /src/types/qr-code.ts
 *
 * QR code types.
 * Replaces inline definitions in:
 *   hooks/useQRCodes.ts, components/locations/QRCodeFormConfig.tsx,
 *   components/locations/QRCodeTemplates.tsx, components/locations/QRCodeLocationManager.tsx
 */

// ── Form config (stored as JSON in qr_codes.form_config) ─────────────

export interface QRCodeFormConfig {
  allowed_action_ids: string[];
  allowed_category_ids: string[];
  allowed_object_ids: string[];
  show_urgency: boolean;
  show_media_upload: boolean;
  show_signature: boolean;
  custom_welcome_message?: string | null;
  [key: string]: unknown;
}

// ── QR Code entity ───────────────────────────────────────────────────

export interface QRCode {
  id: string;
  organization_id: string | null;
  building_id: string | null;
  location_element_id: string | null;
  location_group_id: string | null;
  location_ensemble_id: string | null;
  target_slug: string | null;
  display_label: string | null;
  form_config: QRCodeFormConfig | null;
  location: Record<string, unknown> | null;
  is_active: boolean;
  version: number | null;
  last_regenerated_at: string | null;
  created_by: string | null;
  created_at: string;
}

// ── QR Code visual template ──────────────────────────────────────────

export interface QRCodeTemplate {
  id: string;
  label: string;
  description: string | null;
  preview_url: string | null;
  config: Record<string, unknown>;
}
