import type {
  StartupProfile,
  StartupProfileInput,
  StartupStatusInput,
} from "@/interfaces/organization";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getStartupProfile() {
  return requireSuccess(
    await httpClient.get<StartupProfile>("/api/organizations/profile"),
  );
}

export async function getOrganizationById(organizationId: string) {
  return requireSuccess(
    await httpClient.get<StartupProfile>(
      `/api/organizations/${encodeURIComponent(organizationId)}`,
    ),
  );
}

export async function saveStartupProfile(profile: StartupProfileInput) {
  return requireSuccess(
    await httpClient.put<StartupProfile>("/api/organizations/profile", profile),
  );
}

export async function saveStartupStatus(status: StartupStatusInput) {
  return requireSuccess(
    await httpClient.put<StartupProfile>("/api/organizations/status", status),
  );
}
