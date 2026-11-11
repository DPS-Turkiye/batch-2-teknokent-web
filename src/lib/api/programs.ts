import "server-only";

import type { MemberProgramEvent } from "@/interfaces/coordinator-program";
import type {
  OrganizationPrograms,
  Program,
  ProgramDetail,
  ProgramInvitation,
  ProgramName,
} from "@/interfaces/program";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** The JSON is the backend's; an empty answer reads as no programs. */
export function fetchPrograms(actorId: string) {
  return backendRequest<Program[] | null>({
    method: "GET",
    url: "/api/programs",
    params: { actorId },
  });
}

export function fetchProgramDetail(programId: string, actorId: string) {
  return backendRequest<ProgramDetail>({
    method: "GET",
    url: `/api/programs/${encodeURIComponent(programId)}`,
    params: { actorId },
  });
}

export function fetchProgramNames() {
  return backendRequest<ProgramName[]>({
    method: "GET",
    url: "/api/programs/names",
  });
}

export function fetchMemberProgramEvents(
  actorId: string,
  range: { from: string; to: string },
) {
  return backendRequest<MemberProgramEvent[]>({
    method: HttpMethod.Get,
    url: "/api/programs/events",
    params: { actorId, from: range.from, to: range.to },
  });
}

export function fetchOrganizationPrograms(actorId: string) {
  return backendRequest<OrganizationPrograms>({
    method: "GET",
    url: "/api/programs/mine",
    params: { actorId },
  });
}

export function updateActiveProgram(actorId: string, programId: string | null) {
  return backendRequest<OrganizationPrograms>({
    method: "PUT",
    url: "/api/programs/mine/active",
    data: { actorId, programId },
  });
}

export function fetchProgramInvitations(actorId: string) {
  return backendRequest<ProgramInvitation[]>({
    method: "GET",
    url: "/api/programs/invitations",
    params: { actorId },
  });
}

export function createProgram(actorId: string, name: string) {
  return backendRequest<Program>({
    method: "POST",
    url: "/api/programs",
    data: { actorId, name },
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
