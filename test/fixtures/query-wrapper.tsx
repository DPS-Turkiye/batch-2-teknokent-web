import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { createTestQueryClient } from "@test/test-utils";

/** A renderHook wrapper around one QueryClient, handed back so a test can seed or inspect its cache. */
export function queryWrapper(
  queryClient: QueryClient = createTestQueryClient(),
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, wrapper: Wrapper };
}
