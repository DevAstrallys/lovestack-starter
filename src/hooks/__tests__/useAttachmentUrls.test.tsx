import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/services/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/storage')>();
  return { ...actual, createAttachmentSignedUrls: vi.fn() };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { useAttachmentUrls } from '../useAttachmentUrls';
import { createAttachmentSignedUrls } from '@/services/storage';

const mockSign = createAttachmentSignedUrls as ReturnType<typeof vi.fn>;

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useAttachmentUrls', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns signed URLs aligned with the attachments, including legacy entries', async () => {
    mockSign.mockResolvedValue({
      'new.jpg': 'https://signed/new',
      'old.jpg': 'https://signed/old',
    });

    const attachments = [
      { name: 'Nouvelle', type: 'image', storage_path: 'new.jpg' },
      { name: 'Sans chemin', type: 'image' },
      {
        name: 'Ancienne',
        type: 'image',
        url: 'https://p.supabase.co/storage/v1/object/public/ticket-attachments/old.jpg',
      },
    ];

    const { result } = renderHook(() => useAttachmentUrls(attachments), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.urls[0]).toBe('https://signed/new'));
    expect(result.current.urls).toEqual(['https://signed/new', undefined, 'https://signed/old']);
    expect(mockSign).toHaveBeenCalledWith(['new.jpg', 'old.jpg']);
  });

  it('does not call the API when there are no attachments', () => {
    const { result } = renderHook(() => useAttachmentUrls(null), { wrapper: createWrapper() });
    expect(result.current.urls).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockSign).not.toHaveBeenCalled();
  });
});
