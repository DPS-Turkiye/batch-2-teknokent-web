import "server-only";

import { NextResponse } from "next/server";

import { UserRole } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";
import { apiText } from "@/lib/server/api-response";
import { hasPermission } from "@/lib/permissions";

/** Coordinators run their programs; an admin may open any coordinator screen too. */
export async function requireCoordinatorSession() {
  const session = await getSessionUser();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED", message: await apiText("sessionMissing") },
        { status: 401 },
      ),
    };
  }
  if (
    !hasPermission(session, UserRole.Coordinator) &&
    !hasPermission(session, UserRole.Admin)
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          code: "FORBIDDEN",
          message: await apiText("coordinatorsOnlyPage"),
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}
