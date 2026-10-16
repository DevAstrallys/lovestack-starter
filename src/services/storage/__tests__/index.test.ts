import { describe, it, expect, vi, beforeEach } from 'vitest';

const upload = vi.fn();
const createSignedUrls = vi.fn();
const getPublicUrl = vi.fn();
const storageFrom = vi.fn((_bucket: string) => ({ upload, createSignedUrls, getPublicUrl }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { storage: { from: (bucket: string) => storageFrom(bucket) } },
}));

import {
  uploadTicketMedia,
  uploadTicketChatAttachment,
  uploadOrganizationLogo,
  resolveAttachmentPath,
  createAttachmentSignedUrls,
  TICKET_ATTACHMENTS_BUCKET,
  ORGANIZATION_LOGOS_BUCKET,
} from '../index';

const UUID_RE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

describe('storage service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upload.mockResolvedValue({ error: null });
  });

  describe('uploadTicketMedia', () => {
    it('uploads to the private attachments bucket with a random, non-guessable name', async () => {
      const file = new File(['x'], 'Photo Fuite.JPG', { type: 'image/jpeg' });
      const { path } = await uploadTicketMedia(file);

      expect(storageFrom).toHaveBeenCalledWith(TICKET_ATTACHMENTS_BUCKET);
      expect(path).toMatch(new RegExp(`^${UUID_RE}\\.jpg$`));
      expect(path).not.toContain('Fuite');
      expect(upload).toHaveBeenCalledWith(path, file, { contentType: 'image/jpeg', upsert: false });
    });

    it('never asks for a public URL', async () => {
      await uploadTicketMedia(new File(['x'], 'a.png', { type: 'image/png' }));
      expect(getPublicUrl).not.toHaveBeenCalled();
    });

    it('throws when the upload is refused', async () => {
      upload.mockResolvedValueOnce({ error: new Error('refused') });
      await expect(uploadTicketMedia(new File(['x'], 'a.png'))).rejects.toThrow('refused');
    });
  });

  describe('uploadTicketChatAttachment', () => {
    it('stores the file under the ticket folder and returns the original name', async () => {
      const file = new File(['x'], 'devis.pdf', { type: 'application/pdf' });
      const result = await uploadTicketChatAttachment('ticket-123', file);

      expect(result.fileName).toBe('devis.pdf');
      expect(result.path).toMatch(new RegExp(`^ticket-123/${UUID_RE}\\.pdf$`));
    });
  });

  describe('uploadOrganizationLogo', () => {
    it('uploads to the public logos bucket and returns its public URL', async () => {
      getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/logo.png' } });
      const result = await uploadOrganizationLogo('org-1', new File(['x'], 'logo.png', { type: 'image/png' }));

      expect(storageFrom).toHaveBeenCalledWith(ORGANIZATION_LOGOS_BUCKET);
      expect(result.path).toMatch(/^org-1\/logo-\d+\.png$/);
      expect(result.publicUrl).toBe('https://cdn/logo.png');
    });
  });

  describe('resolveAttachmentPath', () => {
    it('prefers storage_path', () => {
      expect(resolveAttachmentPath({ storage_path: 'abc.jpg', url: 'https://x' })).toBe('abc.jpg');
    });

    it('recovers the path from a legacy public URL', () => {
      const url = 'https://proj.supabase.co/storage/v1/object/public/ticket-attachments/abc%20d.jpg';
      expect(resolveAttachmentPath({ url })).toBe('abc d.jpg');
    });

    it('recovers nested paths', () => {
      const url = 'https://proj.supabase.co/storage/v1/object/public/ticket-attachments/t1/123_a.png?x=1';
      expect(resolveAttachmentPath({ url })).toBe('t1/123_a.png');
    });

    it('returns null for unknown URLs or empty entries', () => {
      expect(resolveAttachmentPath({ url: 'https://example.com/a.png' })).toBeNull();
      expect(resolveAttachmentPath({})).toBeNull();
      expect(resolveAttachmentPath(null)).toBeNull();
    });
  });

  describe('createAttachmentSignedUrls', () => {
    it('returns an empty map without calling the API when there is nothing to sign', async () => {
      expect(await createAttachmentSignedUrls([])).toEqual({});
      expect(createSignedUrls).not.toHaveBeenCalled();
    });

    it('deduplicates paths and drops entries the user cannot read', async () => {
      createSignedUrls.mockResolvedValue({
        data: [
          { path: 'a.jpg', signedUrl: 'https://signed/a', error: null },
          { path: 'b.jpg', signedUrl: '', error: 'Either the object does not exist or you do not have access to it' },
        ],
        error: null,
      });

      const result = await createAttachmentSignedUrls(['a.jpg', 'a.jpg', 'b.jpg'], 600);

      expect(createSignedUrls).toHaveBeenCalledWith(['a.jpg', 'b.jpg'], 600);
      expect(result).toEqual({ 'a.jpg': 'https://signed/a' });
    });

    it('throws on API error', async () => {
      createSignedUrls.mockResolvedValue({ data: null, error: new Error('boom') });
      await expect(createAttachmentSignedUrls(['a.jpg'])).rejects.toThrow('boom');
    });
  });
});
