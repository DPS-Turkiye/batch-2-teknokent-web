import { NextIntlClientProvider } from "next-intl";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import toolsEn from "@/messages/profile-tools/en.json";
import toolsTr from "@/messages/profile-tools/tr.json";
import { createTestQueryClient } from "@test/test-utils";
import type { ProfileAnalysis } from "@/interfaces/profile-analysis";

export function profileToolsWrapper(locale: "tr" | "en" = "en") {
  const client = createTestQueryClient();
  return {
    client,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider
        locale={locale}
        messages={{
          ...(locale === "en" ? en : tr),
          profileTools: locale === "en" ? toolsEn : toolsTr,
        }}
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
    profileType: "mentee",
    status: "DRAFT",
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
