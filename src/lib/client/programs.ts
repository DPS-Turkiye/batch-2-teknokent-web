import type { MemberProgramEvent } from "@/interfaces/coordinator-program";
import type {
  OrganizationPrograms,
  Program,
  ProgramDetail,
  ProgramInvitation,
  ProgramName,
} from "@/interfaces/program";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function getPrograms() {
  return requireSuccess(await backendHttp.get<Program[]>("/api/programs"));
}

export async function getProgramDetail(programId: string) {
  return requireSuccess(
    await backendHttp.get<ProgramDetail>(
      `/api/programs/${encodeURIComponent(programId)}`,
    ),
  );
}

export async function getProgramNames() {
  return requireSuccess(
    await backendHttp.get<ProgramName[]>("/api/programs/names"),
  );
}

export async function getMemberProgramEvents(range: { from: Date; to: Date }) {
  return requireSuccess(
    await backendHttp.get<MemberProgramEvent[]>("/api/programs/events", {
      params: { from: range.from.toISOString(), to: range.to.toISOString() },
    }),
  );
}

export async function getOrganizationPrograms() {
  return requireSuccess(
    await backendHttp.get<OrganizationPrograms>("/api/programs/mine"),
  );
}

export async function setActiveProgram(programId: string | null) {
  return requireSuccess(
    await backendHttp.put<OrganizationPrograms>("/api/programs/mine/active", {
      programId,
    }),
  );
}

export async function getProgramInvitations() {
  return requireSuccess(
    await backendHttp.get<ProgramInvitation[]>("/api/programs/invitations"),
  );
}

export async function createProgram(name: string) {
  return requireSuccess(
    await backendHttp.post<Program>("/api/programs", { name }),
  );
}

export async function decideProgramInvitation(
  programId: string,
  accepted: boolean,
) {
  return requireSuccess(
    await backendHttp.post<ProgramInvitation>(
      `/api/programs/${encodeURIComponent(programId)}/invitations/decide`,
      { accepted },
    ),
  );
}
