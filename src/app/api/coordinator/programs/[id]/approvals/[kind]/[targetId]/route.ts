import { NextResponse } from "next/server";
import { z } from "zod";

import { ApprovalKind } from "@/interfaces/program-approvals";
import { decideProgramApproval } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

const decisionSchema = z.object({ accepted: z.boolean() });

function isApprovalKind(value: string): value is ApprovalKind {
  return (Object.values(ApprovalKind) as string[]).includes(value);
}

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; kind: string; targetId: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, kind, targetId } = await params;
    if (!isApprovalKind(kind)) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("decisionSaveFailed"),
        },
        { status: 404 },
      );
    }
    const body = await readJsonBody(request, decisionSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await decideProgramApproval(
        auth.session.userId,
        id,
        kind,
        targetId,
        body.data.accepted,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("decisionSaveFailed"),
    });
  }
}
