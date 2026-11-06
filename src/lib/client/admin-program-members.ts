import type { ProgramMemberKind } from "@/interfaces/admin-overview";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function assignToProgram(
  programId: string,
  kind: ProgramMemberKind,
  targetId: string,
) {
  requireSuccess(
    await httpClient.post<void>(
      `/api/admin/programs/${encodeURIComponent(programId)}/${kind}/${encodeURIComponent(targetId)}`,
    ),
  );
}
