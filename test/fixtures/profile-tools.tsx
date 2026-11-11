import { QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

import {
  ProfileAnalysisStatus,
  ProfileAnalysisType,
  type ProfileAnalysis,
} from "@/interfaces/profile-analysis";
import { appMessages, asLocale, type TestLocale } from "@test/i18n";
import { createTestQueryClient } from "@test/test-utils";

export function profileToolsWrapper(locale: TestLocale = "en") {
  const client = createTestQueryClient();
  return {
    client,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider
        locale={asLocale(locale)}
        messages={appMessages(locale)}
      >
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </NextIntlClientProvider>
    ),
  };
}

export function analysis(
  overrides: Partial<ProfileAnalysis> = {},
): ProfileAnalysis {
  return {
    id: "analysis-1",
    sourceFilename: "startup.pdf",
    profileType: ProfileAnalysisType.Startup,
    status: ProfileAnalysisStatus.Draft,
    createdAt: "2026-11-03T10:00:00Z",
    profile: {
      startup_name: "Launch Team",
      startup_summary: "Build a useful product",
      technologies: ["Java", "React"],
      support_needs: ["Sales"],
      technology_inferences: [
        {
          tag: "React",
          type: "EXPLICIT_RECOVERY",
          confidence: "HIGH",
          evidence: "Frontend project",
        },
      ],
    },
    ...overrides,
  };
}
