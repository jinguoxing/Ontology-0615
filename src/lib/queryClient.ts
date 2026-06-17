import {QueryClient} from '@tanstack/react-query';

/**
 * Shared React Query client.
 *
 * - staleTime 30s: mock data changes rarely; avoids refetch spam on mount.
 * - refetchOnWindowFocus off: not useful for this internal workbench.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
