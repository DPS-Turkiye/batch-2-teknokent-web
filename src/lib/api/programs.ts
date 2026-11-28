import "server-only";

import type {
  OrganizationPrograms,
  Program,
  ProgramInvitation,
} from "@/interfaces/program";
import { backendRequest } from "@/lib/server/backend-client";

/** The JSON is the backend's; an empty answer reads as no programs. */
export function fetchPrograms(actorId: string) {
  return backendRequest<Program[] | null>({
    method: "GET",
    url: "/api/programs",
    params: { actorId },
  });
}

export function fetchOrganizationPrograms(actorId: string) {
  return backendRequest<OrganizationPrograms>({
    method: "GET",
    url: "/api/programs/mine",
    params: { actorId },
  });
}

export function decideProgramInvitation(
  actorId: string,
  programId: string,
  accepted: boolean,
) {
  return backendRequest<ProgramInvitation>({
    method: "POST",
    url: `/api/programs/${encodeURIComponent(programId)}/invitations/decide`,
    data: { actorId, accepted },
  });
}
