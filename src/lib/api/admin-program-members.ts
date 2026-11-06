import "server-only";

import type { ProgramMemberKind } from "@/interfaces/admin-overview";
import { backendRequest } from "@/lib/server/backend-client";

export function assignToProgram(
  actorId: string,
  programId: string,
  kind: ProgramMemberKind,
  targetId: string,
) {
  return backendRequest<void>({
    method: "POST",
    url: `/api/admin/programs/${encodeURIComponent(programId)}/${kind}/${encodeURIComponent(targetId)}`,
    params: { actorId },
  });
}
