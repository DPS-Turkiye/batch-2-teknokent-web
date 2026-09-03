import type {
  StartupProfile,
  StartupProfileInput,
} from "@/interfaces/organization";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getStartupProfile() {
  return requireSuccess(
    await httpClient.get<StartupProfile>("/api/organizations/profile"),
  );
}

export async function saveStartupProfile(profile: StartupProfileInput) {
  return requireSuccess(
    await httpClient.put<StartupProfile>("/api/organizations/profile", profile),
  );
}
