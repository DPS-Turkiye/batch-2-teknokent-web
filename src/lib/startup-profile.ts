import "server-only";

import type { StartupContext } from "@/interfaces/startup";
import { backendRequest } from "@/lib/server/backend-client";

type OrganizationResponse = {
  id: string;
  name: string;
  description?: string | null;
};

type ProfileAnalysisResponse = {
  sourceFilename?: string;
  profile?: unknown;
};

function profileObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function loadStartupContext(organizationId: string): Promise<{
  startup: StartupContext;
  error?: string;
}> {
  try {
    const [organizationResponse, profileResponse] = await Promise.all([
      backendRequest<OrganizationResponse>({
        method: "GET",
        url: `/api/organizations/${encodeURIComponent(organizationId)}`,
      }),
      backendRequest<ProfileAnalysisResponse>({
        method: "GET",
        url: "/api/profile-analyses/latest/confirmed",
        params: { organizationId },
      }),
    ]);

    if (organizationResponse.status !== 200) {
      throw new Error(
        `Organization API returned HTTP ${organizationResponse.status}`,
      );
    }

    const organization = organizationResponse.data as OrganizationResponse;
    const analysis =
      profileResponse.status === 200
        ? (profileResponse.data as ProfileAnalysisResponse)
        : null;
    const profile = profileObject(analysis?.profile);
    const sectors = textList(profile.sectors);
    const confirmedProfile = analysis !== null;

    return {
      startup: {
        organizationId: organization.id,
        name: text(profile.startup_name) || organization.name,
        summary:
          text(profile.startup_summary) ||
          organization.description?.trim() ||
          "",
        sector: sectors.join(", "),
        stage: text(profile.stage),
        teamSize:
          typeof profile.team_size === "number" ? profile.team_size : undefined,
        technologies: textList(profile.technologies),
        confirmedProfile,
        sourceFilename: analysis?.sourceFilename,
      },
      error:
        profileResponse.status === 404
          ? "Onaylanmış girişim profili bulunamadı; kuruluş bilgileri gösteriliyor."
          : profileResponse.status === 200
            ? undefined
            : `Profil hizmeti HTTP ${profileResponse.status} yanıtı verdi; kuruluş bilgileri gösteriliyor.`,
    };
  } catch (error) {
    return {
      startup: {
        organizationId,
        name: "Girişim",
        summary: "",
        sector: "",
        stage: "",
        technologies: [],
        confirmedProfile: false,
      },
      error:
        error instanceof Error
          ? error.message
          : "Girişim bilgileri yüklenemedi.",
    };
  }
}
