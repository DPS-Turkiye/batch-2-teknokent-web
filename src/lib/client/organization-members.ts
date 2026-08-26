import type { OrganizationMember } from "@/interfaces/organization-member";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getOrganizationMembers() {
  return requireSuccess(
    await httpClient.get<OrganizationMember[]>("/api/organization-members"),
  );
}

export async function addOrganizationMember(input: {
  fullName: string;
  email: string;
  jobTitle?: string;
}) {
  return requireSuccess(
    await httpClient.post<OrganizationMember>(
      "/api/organization-members",
      input,
    ),
  );
}
