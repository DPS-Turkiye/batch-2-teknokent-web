import type {
  OrganizationPrograms,
  ProgramName,
  Program,
  ProgramDirectory,
  ProgramInvitation,
} from "@/interfaces/program";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getPrograms() {
  return requireSuccess(await httpClient.get<Program[]>("/api/programs"));
}

export async function getProgramNames() {
  return requireSuccess(
    await httpClient.get<ProgramName[]>("/api/programs/names"),
  );
}

export async function getOrganizationPrograms() {
  return requireSuccess(
    await httpClient.get<OrganizationPrograms>("/api/programs/mine"),
  );
}

export async function setActiveProgram(programId: string | null) {
  return requireSuccess(
    await httpClient.put<OrganizationPrograms>("/api/programs/mine/active", {
      programId,
    }),
  );
}

export async function getProgramDirectory() {
  return requireSuccess(
    await httpClient.get<ProgramDirectory>("/api/programs/directory"),
  );
}

export async function getProgramInvitations() {
  return requireSuccess(
    await httpClient.get<ProgramInvitation[]>("/api/programs/invitations"),
  );
}

export async function createProgram(name: string) {
  return requireSuccess(
    await httpClient.post<Program>("/api/programs", { name }),
  );
}

export async function addProgramStartup(
  programId: string,
  organizationId: string,
) {
  return requireSuccess(
    await httpClient.post<Program>(
      `/api/programs/${encodeURIComponent(programId)}/startups`,
      { organizationId },
    ),
  );
}

export async function removeProgramStartup(
  programId: string,
  organizationId: string,
) {
  return requireSuccess(
    await httpClient.delete<Program>(
      `/api/programs/${encodeURIComponent(programId)}/startups/${encodeURIComponent(organizationId)}`,
    ),
  );
}

export async function inviteProgramMentor(programId: string, mentorId: string) {
  return requireSuccess(
    await httpClient.post<Program>(
      `/api/programs/${encodeURIComponent(programId)}/mentors`,
      { mentorId },
    ),
  );
}

export async function requestProgramMembership(programId: string) {
  return requireSuccess(
    await httpClient.post<Program>(
      `/api/programs/${encodeURIComponent(programId)}/mentor-requests`,
    ),
  );
}

export async function decideProgramMentorRequest(
  programId: string,
  mentorId: string,
  accepted: boolean,
) {
  return requireSuccess(
    await httpClient.post<Program>(
      `/api/programs/${encodeURIComponent(programId)}/mentor-requests/${encodeURIComponent(mentorId)}/decide`,
      { accepted },
    ),
  );
}

export async function decideProgramInvitation(
  programId: string,
  accepted: boolean,
) {
  return requireSuccess(
    await httpClient.post<ProgramInvitation>(
      `/api/programs/${encodeURIComponent(programId)}/invitations/decide`,
      { accepted },
    ),
  );
}
