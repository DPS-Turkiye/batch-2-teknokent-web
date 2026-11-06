import { NextResponse } from "next/server";

import { ProgramMemberKind } from "@/interfaces/admin-overview";
import { assignToProgram } from "@/lib/api/admin-program-members";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

function isMemberKind(value: string): value is ProgramMemberKind {
  return (Object.values(ProgramMemberKind) as string[]).includes(value);
}

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; kind: string; targetId: string }> },
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const { id, kind, targetId } = await params;
    if (!isMemberKind(kind)) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("programAssignFailed"),
        },
        { status: 404 },
      );
    }
    return backendResponse(
      await assignToProgram(auth.session.userId, id, kind, targetId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programAssignFailed"),
    });
  }
}
