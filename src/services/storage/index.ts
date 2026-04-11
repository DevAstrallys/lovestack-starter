/**
 * /src/services/storage/index.ts
 *
 * Storage service — all Supabase Storage operations.
 * Absorbs direct supabase.storage calls from:
 *   components/tickets/MediaUpload.tsx
 *   components/tickets/TicketCreateForm.tsx
 *   components/admin/VisualIdentitySettings.tsx
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:storage');

interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Upload a file to a Supabase storage bucket and return its public URL.
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { contentType?: string },
): Promise<UploadResult> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType ?? file.type,
      });
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    log.info('File uploaded', { bucket, path });
    return {
      path,
      publicUrl: urlData.publicUrl,
    };
  } catch (err) {
    log.error('File upload failed', { bucket, path, error: err });
    throw err;
  }
}

/**
 * Upload a ticket attachment.
 * Convenience wrapper with standardized path generation.
 */
export async function uploadTicketAttachment(
  ticketId: string,
  file: File,
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return uploadFile('ticket-attachments', path, file);
}

/**
 * Upload an organization logo.
 */
export async function uploadOrganizationLogo(
  organizationId: string,
  file: File,
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${organizationId}/logo.${ext}`;
  return uploadFile('organization-logos', path, file);
}

/**
 * Get the public URL for a file in a bucket.
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
