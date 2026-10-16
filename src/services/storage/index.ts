/**
 * /src/services/storage/index.ts
 *
 * Storage service — the ONLY place allowed to talk to Supabase Storage.
 *
 * Buckets:
 *   - `ticket-attachments` (PRIVATE): photos / audio / video attached to tickets.
 *       Files are never exposed through public URLs. Readers get short-lived
 *       signed URLs, and the storage RLS policy only signs files that belong
 *       to a ticket (or ticket activity) the reader is allowed to see.
 *   - `organization-logos` (PUBLIC): organization logos, shown on public pages.
 *
 * Rule: never persist a URL for a private file — persist its storage path.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import type { TicketAttachment } from '@/types';

const log = createLogger('service:storage');

export const TICKET_ATTACHMENTS_BUCKET = 'ticket-attachments';
export const ORGANIZATION_LOGOS_BUCKET = 'organization-logos';

/** Validity of signed URLs for private attachments (seconds). */
export const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 h

/** Server-side limits mirror these (see docs/sql). Kept here for early UX feedback. */
export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// ── Internal helpers ────────────────────────────────────────────────

function fileExtension(file: File | Blob, fallback: string): string {
  const name = file instanceof File ? file.name : '';
  const ext = name.includes('.') ? name.split('.').pop() : undefined;
  return (ext || fallback).toLowerCase().replace(/[^a-z0-9]/g, '') || fallback;
}

async function uploadToBucket(
  bucket: string,
  path: string,
  file: File | Blob,
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw error;
  log.info('File uploaded', { bucket, path });
  return path;
}

// ── Ticket attachments (private bucket) ─────────────────────────────

/**
 * Upload a media file captured in a ticket form, BEFORE the ticket exists.
 * Returns the storage path to persist in `tickets.attachments[].storage_path`.
 */
export async function uploadTicketMedia(file: File | Blob): Promise<{ path: string }> {
  try {
    const path = `${crypto.randomUUID()}.${fileExtension(file, 'bin')}`;
    await uploadToBucket(TICKET_ATTACHMENTS_BUCKET, path, file);
    return { path };
  } catch (err) {
    log.error('Ticket media upload failed', { error: err });
    throw err;
  }
}

/**
 * Upload a file sent in a ticket conversation (cockpit chat).
 * Returns the storage path to persist in `ticket_activities.metadata.attachment_path`.
 */
export async function uploadTicketChatAttachment(
  ticketId: string,
  file: File,
): Promise<{ path: string; fileName: string }> {
  try {
    const path = `${ticketId}/${crypto.randomUUID()}.${fileExtension(file, 'bin')}`;
    await uploadToBucket(TICKET_ATTACHMENTS_BUCKET, path, file);
    return { path, fileName: file.name };
  } catch (err) {
    log.error('Ticket chat attachment upload failed', { ticketId, error: err });
    throw err;
  }
}

const LEGACY_PUBLIC_URL_PATTERN = new RegExp(
  `/storage/v1/object/(?:public|sign)/${TICKET_ATTACHMENTS_BUCKET}/([^?#]+)`,
);

/**
 * Resolve the storage path of an attachment.
 * Handles legacy entries that only stored a public URL.
 */
export function resolveAttachmentPath(
  attachment: Pick<TicketAttachment, 'storage_path' | 'url'> | null | undefined,
): string | null {
  if (!attachment) return null;
  if (attachment.storage_path) return attachment.storage_path;
  if (attachment.url) {
    const match = attachment.url.match(LEGACY_PUBLIC_URL_PATTERN);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Create short-lived signed URLs for private attachments.
 * Paths the current user is not allowed to read are simply absent from the result.
 */
export async function createAttachmentSignedUrls(
  paths: string[],
  expiresIn: number = SIGNED_URL_TTL_SECONDS,
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  try {
    const { data, error } = await supabase.storage
      .from(TICKET_ATTACHMENTS_BUCKET)
      .createSignedUrls(unique, expiresIn);
    if (error) throw error;

    const result: Record<string, string> = {};
    for (const item of data ?? []) {
      if (item.path && item.signedUrl && !item.error) {
        result[item.path] = item.signedUrl;
      }
    }
    const missing = unique.length - Object.keys(result).length;
    if (missing > 0) log.warn('Some attachments could not be signed', { missing });
    return result;
  } catch (err) {
    log.error('Failed to create signed URLs', { count: unique.length, error: err });
    throw err;
  }
}

// ── Organization logos (public bucket) ──────────────────────────────

/**
 * Upload an organization logo. A new file name is used on every upload so
 * no overwrite permission is needed and browser caches are never stale.
 */
export async function uploadOrganizationLogo(
  organizationId: string,
  file: File,
): Promise<{ path: string; publicUrl: string }> {
  try {
    const path = `${organizationId}/logo-${Date.now()}.${fileExtension(file, 'png')}`;
    await uploadToBucket(ORGANIZATION_LOGOS_BUCKET, path, file);
    const { data } = supabase.storage.from(ORGANIZATION_LOGOS_BUCKET).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  } catch (err) {
    log.error('Organization logo upload failed', { organizationId, error: err });
    throw err;
  }
}
