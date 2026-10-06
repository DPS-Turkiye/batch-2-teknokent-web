import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";
import { DocumentPreviewProvider } from "@/components/providers/document-preview-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

/**
 * Fixes "now" for code that checks how far away a time is. Only Date is faked, so
 * user-event's timers keep running; undo it with vi.useRealTimers() in afterEach.
 */
export function freezeDate(at: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(at));
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <DocumentPreviewProvider>{children}</DocumentPreviewProvider>
        </ToastProvider>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
