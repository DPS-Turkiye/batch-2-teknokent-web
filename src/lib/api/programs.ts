import "server-only";

import {
  UserAccountStatus,
  UserRole,
  type BackendUser,
} from "@/interfaces/session";
import type {
  OrganizationPrograms,
  Program,
  ProgramDirectory,
  ProgramInvitation,
  ProgramStartup,
} from "@/interfaces/program";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchPrograms(actorId: string) {
  return backendRequest<Program[]>({
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

export function addProgramStartup(
  actorId: string,
  programId: string,
  organizationId: string,
) {
  return backendRequest<Program>({
    method: "POST",
    url: `/api/programs/${encodeURIComponent(programId)}/startups`,
    data: { actorId, organizationId },
  });
}

export function removeProgramStartup(
  actorId: string,
  programId: string,
  organizationId: string,
) {
  return backendRequest<Program>({
    method: "DELETE",
    url: `/api/programs/${encodeURIComponent(programId)}/startups/${encodeURIComponent(organizationId)}`,
    params: { actorId },
  });
}

export function inviteProgramMentor(
  actorId: string,
  programId: string,
  mentorId: string,
) {
  return backendRequest<Program>({
    method: "POST",
    url: `/api/programs/${encodeURIComponent(programId)}/mentors`,
    data: { actorId, mentorId },
  });
}

export function requestProgramMembership(actorId: string, programId: string) {
  return backendRequest<Program>({
    method: "POST",
    url: `/api/programs/${encodeURIComponent(programId)}/mentor-requests`,
    params: { actorId },
  });
}

export function decideProgramMentorRequest(
  actorId: string,
  programId: string,
  mentorId: string,
  accepted: boolean,
) {
  return backendRequest<Program>({
    method: "POST",
    url: `/api/programs/${encodeURIComponent(programId)}/mentor-requests/${encodeURIComponent(mentorId)}/decide`,
    data: { actorId, accepted },
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

export async function fetchProgramDirectory() {
  const [startups, mentors] = await Promise.all([
    backendRequest<ProgramStartup[]>({
      method: "GET",
      url: "/api/organizations",
    }),
    backendRequest<BackendUser[]>({
      method: "GET",
      url: "/api/users",
      params: { role: UserRole.Mentor, status: UserAccountStatus.Approved },
    }),
  ]);
  return {
    data: {
      startups: startups.data ?? [],
      mentors: (mentors.data ?? []).map((mentor) => ({
        id: mentor.id,
        fullName: mentor.fullName,
        email: mentor.email,
      })),
    } satisfies ProgramDirectory,
    headers: startups.headers,
    status:
      startups.status >= 400
        ? startups.status
        : mentors.status >= 400
          ? mentors.status
          : 200,
  };
}
