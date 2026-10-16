/**
 * /src/hooks/useAttachmentUrls.ts
 *
 * Returns displayable URLs for ticket attachments stored in the PRIVATE
 * `ticket-attachments` bucket, by requesting short-lived signed URLs.
 *
 * The returned array is aligned with the input array: `urls[i]` is the URL
 * of `attachments[i]`, or `undefined` if it cannot be shown (no path, or the
 * current user is not allowed to read it).
 */
import { useQuery } from '@tanstack/react-query';
import {
  createAttachmentSignedUrls,
  resolveAttachmentPath,
  SIGNED_URL_TTL_SECONDS,
} from '@/services/storage';
import type { TicketAttachment } from '@/types';

// Refresh well before expiry so a URL shown on screen is always valid.
const STALE_TIME_MS = (SIGNED_URL_TTL_SECONDS - 10 * 60) * 1000;

export function useAttachmentUrls(attachments: TicketAttachment[] | null | undefined) {
  const list = attachments ?? [];
  const paths = list.map((a) => resolveAttachmentPath(a));
  const validPaths = paths.filter((p): p is string => Boolean(p));

  const query = useQuery({
    queryKey: ['attachment-signed-urls', [...validPaths].sort()],
    queryFn: () => createAttachmentSignedUrls(validPaths),
    enabled: validPaths.length > 0,
    staleTime: STALE_TIME_MS,
    refetchInterval: STALE_TIME_MS,
  });

  const signed = query.data ?? {};
  const urls = paths.map((p) => (p ? signed[p] : undefined));

  return { urls, isLoading: query.isLoading && validPaths.length > 0, isError: query.isError };
}
