import type { MemberProgramEvent } from "@/interfaces/coordinator-program";
import type {
  OrganizationPrograms,
  Program,
  ProgramDetail,
  ProgramInvitation,
  ProgramName,
} from "@/interfaces/program";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getPrograms() {
  return requireSuccess(await httpClient.get<Program[]>("/api/programs"));
}

export async function getProgramDetail(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramDetail>(
      `/api/programs/${encodeURIComponent(programId)}`,
    ),
  );
}

export async function getProgramNames() {
  return requireSuccess(
    await httpClient.get<ProgramName[]>("/api/programs/names"),
  );
}

export async function getMemberProgramEvents(range: { from: Date; to: Date }) {
  return requireSuccess(
    await httpClient.get<MemberProgramEvent[]>("/api/programs/events", {
      params: { from: range.from.toISOString(), to: range.to.toISOString() },
    }),
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
