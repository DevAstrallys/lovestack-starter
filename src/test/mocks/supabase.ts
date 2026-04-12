import { vi } from 'vitest';

/**
 * Chainable mock that mimics Supabase's PostgREST query builder.
 * Each method returns `this` so calls can be chained, and the
 * final async resolution returns `mockResult`.
 */
export function createChainMock(mockResult: { data: unknown; error: unknown; count?: number | null } = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const handler: ProxyHandler<Record<string, ReturnType<typeof vi.fn>>> = {
    get(_target, prop: string) {
      if (prop === 'then') {
        // Make the chain thenable — resolves with mockResult
        return (resolve: (v: unknown) => void) => resolve(mockResult);
      }
      if (!chain[prop]) {
        chain[prop] = vi.fn().mockReturnValue(new Proxy({}, handler));
      }
      return chain[prop];
    },
  };

  return new Proxy({}, handler);
}

/**
 * Creates a full mock of the supabase client used by services.
 * Usage in tests:
 *
 *   vi.mock('@/integrations/supabase/client', () => ({
 *     supabase: createSupabaseMock(),
 *   }));
 */
export function createSupabaseMock() {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.png' } }),
      }),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  };
}
