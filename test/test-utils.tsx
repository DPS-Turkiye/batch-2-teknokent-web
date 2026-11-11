import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

import { DocumentPreviewHost } from "@/components/common/document-preview-host";
import { Toaster } from "@/components/common/toaster";
import { appMessages, asLocale, type TestLocale } from "@test/i18n";

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
        {children}
        <Toaster />
        <DocumentPreviewHost />
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

/** Renders its children in the given language, the way the root layout's provider does. */
export function InLocale({
  locale,
  children,
}: {
  locale: TestLocale;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={asLocale(locale)}
      messages={appMessages(locale)}
    >
      {children}
    </NextIntlClientProvider>
  );
}
