import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser, switchSessionWorkspace } from "@/lib/session";
import { isWorkspace } from "@/lib/workspaces";

export async function POST(request: NextRequest) {
  try {
    if (!(await getSessionUser())) throw new SessionRequiredError();
    const body = (await request.json().catch(() => ({}))) as {
      workspace?: unknown;
    };
    const switched = isWorkspace(body.workspace)
      ? await switchSessionWorkspace(body.workspace)
      : null;
    if (!switched) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: await apiText("workspaceNotAvailable") },
        { status: 403 },
      );
    }
    return NextResponse.json(switched);
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("workspaceSwitchFailed"),
    });
  }
}
